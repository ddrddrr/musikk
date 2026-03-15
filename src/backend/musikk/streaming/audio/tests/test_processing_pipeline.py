import shutil
import tempfile
import uuid
from pathlib import Path
from unittest.mock import patch, Mock

from django.test import TestCase, override_settings
from django.core.files.storage import default_storage

from utils.storage import delete_django_storage_dir
from streaming.audio.processing_pipeline import (
    ProcessingContext,
    FFmpegStep,
    ShakaPackagerStep,
    ProcessingPipeline,
    AudioProcessingPipeline,
)
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.audio.exceptions import AudioProcessingPipelineError


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
        )

        with self.assertRaises(AudioProcessingPipelineError):
            step.process(ctx)

    def test_ffmpeg_step_rollback_calls_delete(self):
        mock_ffmpeg = Mock()
        mock_ffmpeg.convert_audio.return_value = ["a.mp4"]

        step = FFmpegStep(ffmpeg_wrapper=mock_ffmpeg)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="int_dir_123",
            final_dir="final_dir_123",
        )

        with patch(
            "streaming.audio.processing_pipeline.delete_django_storage_dir"
        ) as mock_del:
            step.rollback(ctx)
            mock_del.assert_called_once_with(storage_dir="int_dir_123")

    def test_shaka_step_requires_converted_paths(self):
        mock_shaka = Mock()
        mock_shaka.package_audio_files.return_value = {"ok": True}

        step = ShakaPackagerStep(shaka_wrapper=mock_shaka)
        ctx = ProcessingContext(
            orig_audio_file_path=str(self.input_file),
            intermediate_dir="i",
            final_dir="f",
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
        with patch(
            "streaming.audio.processing_pipeline.delete_django_storage_dir"
        ) as mock_del:
            res = pipeline.run(source=str(self.input_file), final_storage_dir=final_dir)
            self.assertEqual(res.song_repr, {"mpd": "x"})
            self.assertTrue(
                res.context.intermediate_dir.startswith(final_dir + "/tmp_")
            )
            mock_del.assert_called_once_with(storage_dir=res.context.intermediate_dir)

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
        with patch(
            "streaming.audio.processing_pipeline.delete_django_storage_dir"
        ) as mock_del:
            with self.assertRaises(RuntimeError):
                pipeline.run(source=str(self.input_file), final_storage_dir=final_dir)

            step1.rollback.assert_called_once()
            self.assertTrue(mock_del.called)

    def test_pipeline_conversion_success(self):
        storage_subdir = uuid.uuid4().hex

        pipeline = AudioProcessingPipeline
        result = pipeline.run(
            source=str(self.input_file), final_storage_dir=storage_subdir
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

        self.assertFalse(default_storage.exists(result.context.intermediate_dir))

        delete_django_storage_dir(storage_subdir)

    @classmethod
    def tearDownClass(cls):
        cls.override.disable()
        shutil.rmtree(cls._tmp_media)
        super().tearDownClass()
