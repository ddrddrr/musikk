import shutil
import tempfile
import uuid
from pathlib import Path
from unittest.mock import Mock, patch

from django.core.files.storage import default_storage
from django.test import TestCase, override_settings
from utils.storage import delete_django_storage_dir

from streaming.audio.exceptions import AudioProcessingPipelineError
from streaming.audio.probes import AudioStreamInfo, get_audio_metadata
from streaming.audio.processing_pipeline import (
    AudioProcessingPipeline,
    FFmpegStep,
    LoudnessMeasurementStep,
    ProcessingContext,
    ProcessingPipeline,
    ShakaPackagerStep,
)
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType

MOCK_AUDIO_INFO = AudioStreamInfo(
    duration_seconds=6.0,
    sample_rate=44100,
    channels=2,
    codec_name="pcm_s16le",
    bit_depth=16,
    bit_rate=None,
)


class TestProcessingPipelineSteps(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls._tmp_media = tempfile.mkdtemp()

        cls.override = override_settings(
            DEFAULT_FILE_STORAGE="django.core.files.storage.FileSystemStorage",
            MEDIA_ROOT=cls._tmp_media,
        )
        cls.override.enable()

        tests_dir = Path(__file__).parent
        cls.input_file = tests_dir / "data" / "file1.wav"
        assert cls.input_file.exists(), f"Test input_file not found: {cls.input_file}"

    def test_ffmpeg_step_success_sets_converted_paths(self):
        mock_ffmpeg = Mock()
        mock_ffmpeg.convert_audio.return_value = ["a.mp4", "b.mp4"]

        step = FFmpegStep(ffmpeg_wrapper=mock_ffmpeg)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="some/intermediate",
            final_dir="some/final",
            audio_info=MOCK_AUDIO_INFO,
        )

        step.process(ctx)
        self.assertEqual(ctx.converted_paths, ["a.mp4", "b.mp4"])

    def test_ffmpeg_step_raises_when_no_outputs(self):
        mock_ffmpeg = Mock()
        mock_ffmpeg.convert_audio.return_value = []

        step = FFmpegStep(ffmpeg_wrapper=mock_ffmpeg)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="some/intermediate",
            final_dir="some/final",
            audio_info=MOCK_AUDIO_INFO,
        )

        with self.assertRaises(AudioProcessingPipelineError):
            step.process(ctx)

    def test_ffmpeg_step_rollback_removes_intermediate_dir(self):
        mock_ffmpeg = Mock()
        mock_ffmpeg.convert_audio.return_value = ["a.mp4"]

        step = FFmpegStep(ffmpeg_wrapper=mock_ffmpeg)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="/tmp/int_dir_123",
            final_dir="final_dir_123",
            audio_info=MOCK_AUDIO_INFO,
        )

        with patch("streaming.audio.processing_pipeline.shutil.rmtree") as mock_rmtree:
            step.rollback(ctx)
            mock_rmtree.assert_called_once_with("/tmp/int_dir_123", ignore_errors=True)

    def test_shaka_step_requires_converted_paths(self):
        mock_shaka = Mock()
        mock_shaka.package_audio_files.return_value = {"ok": True}

        step = ShakaPackagerStep(shaka_wrapper=mock_shaka)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="i",
            final_dir="f",
            audio_info=MOCK_AUDIO_INFO,
            converted_paths=[],
        )

        with self.assertRaises(AudioProcessingPipelineError):
            step.process(ctx)

    def test_shaka_step_success_sets_song_repr(self):
        mock_shaka = Mock()
        mock_shaka.package_audio_files.return_value = {"manifest": "value"}

        step = ShakaPackagerStep(shaka_wrapper=mock_shaka)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="i",
            final_dir="f",
            audio_info=MOCK_AUDIO_INFO,
            converted_paths=["a.mp4"],
        )

        step.process(ctx)
        self.assertEqual(ctx.song_repr, {"manifest": "value"})

    def test_shaka_step_rollback_calls_delete(self):
        mock_shaka = Mock()
        mock_shaka.package_audio_files.return_value = {"m": 1}

        step = ShakaPackagerStep(shaka_wrapper=mock_shaka)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="i",
            final_dir="final_dir_xyz",
            audio_info=MOCK_AUDIO_INFO,
            converted_paths=["a.mp4"],
        )

        with patch(
            "streaming.audio.processing_pipeline.delete_django_storage_dir"
        ) as mock_del:
            step.rollback(ctx)
            mock_del.assert_called_once_with(storage_dir="final_dir_xyz")

    def test_pipeline_run_success_returns_result_and_cleans_intermediate(self):
        step1 = Mock()
        step2 = Mock()

        def proc1(ctx):
            ctx.converted_paths = ["a.mp4"]

        def proc2(ctx):
            ctx.song_repr = {"mpd": "x"}

        step1.process.side_effect = proc1
        step1.rollback = Mock()
        step2.process.side_effect = proc2
        step2.rollback = Mock()

        pipeline = ProcessingPipeline(steps=[step1, step2], do_cleanup=True)
        final_dir = "final_dir_for_pipeline"
        with patch("streaming.audio.processing_pipeline.shutil.rmtree") as mock_rmtree:
            res = pipeline.run(
                source=str(self.input_file),
                final_storage_dir=final_dir,
                audio_info=MOCK_AUDIO_INFO,
            )
            self.assertEqual(res.song_repr, {"mpd": "x"})
            mock_rmtree.assert_called_once_with(
                res.context.intermediate_dir, ignore_errors=True
            )

    def test_pipeline_rolls_back_executed_steps_on_error_and_cleans_up(self):
        step1 = Mock()
        step2 = Mock()

        def proc1(ctx):
            ctx.converted_paths = ["a.mp4"]

        def proc2(ctx):
            raise RuntimeError("boom")

        step1.process.side_effect = proc1
        step1.rollback = Mock()
        step2.process.side_effect = proc2
        step2.rollback = Mock()

        pipeline = ProcessingPipeline(steps=[step1, step2], do_cleanup=True)
        final_dir = "final_dir_for_pipeline2"
        with patch("streaming.audio.processing_pipeline.shutil.rmtree") as mock_rmtree:
            with self.assertRaises(RuntimeError):
                pipeline.run(
                    source=str(self.input_file),
                    final_storage_dir=final_dir,
                    audio_info=MOCK_AUDIO_INFO,
                )

            step1.rollback.assert_called_once()
            self.assertTrue(mock_rmtree.called)

    def test_pipeline_conversion_success(self):
        storage_subdir = uuid.uuid4().hex
        audio_info = get_audio_metadata(self.input_file)

        pipeline = AudioProcessingPipeline
        result = pipeline.run(
            source=str(self.input_file),
            final_storage_dir=storage_subdir,
            audio_info=audio_info,
        )

        self.assertIsNotNone(result.song_repr)

        self.assertIn(ManifestType.MPD, result.song_repr.manifests)
        self.assertIn(ManifestType.M3U8, result.song_repr.manifests)

        mpd_path = result.song_repr.manifests[ManifestType.MPD]
        m3u8_path = result.song_repr.manifests[ManifestType.M3U8]

        self.assertTrue(
            default_storage.exists(mpd_path),
            f"MPD manifest not found in storage: {mpd_path}",
        )
        self.assertTrue(
            default_storage.exists(m3u8_path),
            f"HLS master playlist not found in storage: {m3u8_path}",
        )

        self.assertIsNotNone(result.loudness_lufs)
        self.assertIsNotNone(result.true_peak_dbtp)

        self.assertFalse(
            Path(result.context.intermediate_dir).exists(),
            "Intermediate local directory should have been cleaned up",
        )

        delete_django_storage_dir(storage_subdir)

    @classmethod
    def tearDownClass(cls):
        cls.override.disable()
        shutil.rmtree(cls._tmp_media)
        super().tearDownClass()


class TestLoudnessMeasurementStepTargetSelection(TestCase):
    @patch("streaming.audio.processing_pipeline.get_audio_loudness")
    def test_prefers_flac_output(self, mock_loudness):
        mock_loudness.return_value = (-14.0, -1.0)
        step = LoudnessMeasurementStep()
        ctx = ProcessingContext(
            orig_audio_file_path="/fake/source.wav",
            intermediate_dir="/tmp/inter",
            final_dir="/tmp/final",
            audio_info=MOCK_AUDIO_INFO,
            converted_paths=[
                "/tmp/inter/libfdk_aac-96-abc.mp4",
                "/tmp/inter/flac-None-def.mp4",
                "/tmp/inter/libfdk_aac-320-ghi.mp4",
            ],
        )
        step.process(ctx)
        mock_loudness.assert_called_once_with("/tmp/inter/flac-None-def.mp4")
        self.assertAlmostEqual(ctx.loudness_lufs, -14.0)
        self.assertAlmostEqual(ctx.true_peak_dbtp, -1.0)

    @patch("streaming.audio.processing_pipeline.get_audio_loudness")
    def test_falls_back_to_first_when_no_flac(self, mock_loudness):
        mock_loudness.return_value = (-16.0, -2.0)
        step = LoudnessMeasurementStep()
        ctx = ProcessingContext(
            orig_audio_file_path="/fake/source.wav",
            intermediate_dir="/tmp/inter",
            final_dir="/tmp/final",
            audio_info=MOCK_AUDIO_INFO,
            converted_paths=[
                "/tmp/inter/libfdk_aac-96-abc.mp4",
                "/tmp/inter/libfdk_aac-320-ghi.mp4",
            ],
        )
        step.process(ctx)
        mock_loudness.assert_called_once_with("/tmp/inter/libfdk_aac-96-abc.mp4")

    @patch("streaming.audio.processing_pipeline.get_audio_loudness")
    def test_silent_audio_sets_none(self, mock_loudness):
        mock_loudness.return_value = (None, None)
        step = LoudnessMeasurementStep()
        ctx = ProcessingContext(
            orig_audio_file_path="/fake/source.wav",
            intermediate_dir="/tmp/inter",
            final_dir="/tmp/final",
            audio_info=MOCK_AUDIO_INFO,
            converted_paths=["/tmp/inter/flac-None-abc.mp4"],
        )
        step.process(ctx)
        self.assertIsNone(ctx.loudness_lufs)
        self.assertIsNone(ctx.true_peak_dbtp)
