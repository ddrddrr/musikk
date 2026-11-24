import shutil
import tempfile
import time
import uuid
from pathlib import Path
from unittest.mock import Mock, patch

from django.core.files.storage import default_storage
from django.test import TestCase, override_settings
from utils.storage import delete_django_storage_dir

from streaming.audio.exceptions import AudioProcessingPipelineError
from streaming.audio.ffmpeg_conf.converters import (
    AAC_96_CONVERTER,
    AAC_160_CONVERTER,
    AAC_320_CONVERTER,
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    ConvertedFile,
)
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

AAC_96_FILE = ConvertedFile(path="a.mp4", converter=AAC_96_CONVERTER)
AAC_160_FILE = ConvertedFile(path="b.mp4", converter=AAC_160_CONVERTER)


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

    def test_ffmpeg_step_success_sets_converted_files(self):
        mock_ffmpeg = Mock()
        mock_ffmpeg.convert_audio.return_value = [AAC_96_FILE, AAC_160_FILE]

        step = FFmpegStep(ffmpeg_wrapper=mock_ffmpeg)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="some/intermediate",
            final_dir="some/final",
            audio_info=MOCK_AUDIO_INFO,
        )

        step.process(ctx)
        self.assertEqual(ctx.converted_files, [AAC_96_FILE, AAC_160_FILE])

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
        mock_ffmpeg.convert_audio.return_value = [AAC_96_FILE]

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

    def test_shaka_step_requires_converted_files(self):
        mock_shaka = Mock()
        mock_shaka.package_audio_files.return_value = {"ok": True}

        step = ShakaPackagerStep(shaka_wrapper=mock_shaka)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="i",
            final_dir="f",
            audio_info=MOCK_AUDIO_INFO,
            converted_files=[],
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
            converted_files=[AAC_96_FILE],
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
            converted_files=[AAC_96_FILE],
        )

        with patch(
            "streaming.audio.processing_pipeline.delete_django_storage_dir"
        ) as mock_del:
            step.rollback(ctx)
            mock_del.assert_called_once_with(storage_dir="final_dir_xyz")

    def test_ffmpeg_step_passes_remaining_time_as_timeout(self):
        mock_ffmpeg = Mock()
        mock_ffmpeg.convert_audio.return_value = [AAC_96_FILE]
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="i",
            final_dir="f",
            audio_info=MOCK_AUDIO_INFO,
            deadline=time.monotonic() + 100,
        )

        FFmpegStep(ffmpeg_wrapper=mock_ffmpeg).process(ctx)

        timeout = mock_ffmpeg.convert_audio.call_args.kwargs["timeout"]
        self.assertGreater(timeout, 90)
        self.assertLessEqual(timeout, 100)

    def test_remaining_seconds_raises_after_deadline(self):
        ctx = ProcessingContext(
            orig_audio_file_path="s",
            intermediate_dir="i",
            final_dir="f",
            audio_info=MOCK_AUDIO_INFO,
            deadline=time.monotonic() - 1,
        )
        with self.assertRaises(AudioProcessingPipelineError):
            ctx.remaining_seconds()

    def test_pipeline_run_success_returns_result_and_cleans_intermediate(self):
        step1 = Mock()
        step2 = Mock()

        def proc1(ctx):
            ctx.converted_files = [AAC_96_FILE]

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
                work_dir=Path(self._tmp_media) / "work",
            )
            self.assertEqual(res.song_repr, {"mpd": "x"})
            mock_rmtree.assert_called_once_with(
                res.context.intermediate_dir, ignore_errors=True
            )

    def test_pipeline_rolls_back_executed_steps_on_error_and_cleans_up(self):
        step1 = Mock()
        step2 = Mock()

        def proc1(ctx):
            ctx.converted_files = [AAC_96_FILE]

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
                    work_dir=Path(self._tmp_media) / "work",
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
            work_dir=Path(self._tmp_media) / "work",
            deadline=time.monotonic() + 120,
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
    def _measure(
        self,
        files: list[ConvertedFile],
        loudness: tuple[float | None, float | None] = (-14.0, -1.0),
    ) -> tuple[ProcessingContext, Mock]:
        ctx = ProcessingContext(
            orig_audio_file_path="/fake/source.wav",
            intermediate_dir="/tmp/inter",
            final_dir="/tmp/final",
            audio_info=MOCK_AUDIO_INFO,
            converted_files=files,
        )
        with patch(
            "streaming.audio.processing_pipeline.get_audio_loudness",
            return_value=loudness,
        ) as mock_loudness:
            LoudnessMeasurementStep().process(ctx)
        return ctx, mock_loudness

    def test_lossless_upload_measures_flac_version(self):
        ctx, mock_loudness = self._measure(
            [
                ConvertedFile(path="/tmp/inter/1.mp4", converter=AAC_320_CONVERTER),
                ConvertedFile(path="/tmp/inter/2.mp4", converter=FLAC_CONVERTER),
                ConvertedFile(path="/tmp/inter/3.mp4", converter=AAC_96_CONVERTER),
            ]
        )
        mock_loudness.assert_called_once_with("/tmp/inter/2.mp4", timeout=None)
        self.assertAlmostEqual(ctx.loudness_lufs, -14.0)
        self.assertAlmostEqual(ctx.true_peak_dbtp, -1.0)

    def test_lossy_upload_measures_highest_aac_bitrate(self):
        _, mock_loudness = self._measure(
            [
                ConvertedFile(path="/tmp/inter/1.mp4", converter=AACHEv2_CONVERTER),
                ConvertedFile(path="/tmp/inter/2.mp4", converter=AAC_160_CONVERTER),
                ConvertedFile(path="/tmp/inter/3.mp4", converter=AAC_96_CONVERTER),
            ]
        )
        mock_loudness.assert_called_once_with("/tmp/inter/2.mp4", timeout=None)

    def test_silent_audio_sets_none(self):
        ctx, _ = self._measure(
            [ConvertedFile(path="/tmp/inter/1.mp4", converter=FLAC_CONVERTER)],
            loudness=(None, None),
        )
        self.assertIsNone(ctx.loudness_lufs)
        self.assertIsNone(ctx.true_peak_dbtp)
