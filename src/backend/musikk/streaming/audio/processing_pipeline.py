import logging
import shutil
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path

from utils.storage import delete_django_storage_dir

from streaming.audio.exceptions import AudioProcessingPipelineError
from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import FFMPEGFull, FFMPEGWrapper
from streaming.audio.normalization import build_normalization_filters
from streaming.audio.probes import (
    AudioStreamInfo,
    get_audio_loudness,
)
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import (
    ShakaPackagerMPDAndM3U8,
    ShakaPackagerWrapper,
    SongRepresentation,
)

logger = logging.getLogger(__name__)


@dataclass
class ProcessingContext:
    """
    Holds state shared between pipeline steps.
    """

    orig_audio_file_path: str
    intermediate_dir: str
    final_dir: str
    audio_info: AudioStreamInfo
    converted_paths: list[str] = field(default_factory=list)
    song_repr: SongRepresentation | None = None
    loudness_lufs: float | None = None
    true_peak_dbtp: float | None = None


class Step(ABC):
    """
    Base class for pipeline steps.
    """

    @abstractmethod
    def process(self, ctx: ProcessingContext) -> None:
        raise NotImplementedError

    def rollback(self, ctx: ProcessingContext) -> None:
        return None


class FFmpegStep(Step):
    def __init__(self, ffmpeg_wrapper: FFMPEGWrapper = FFMPEGFull):
        self.wrapper = ffmpeg_wrapper

    def process(self, ctx: ProcessingContext) -> None:
        try:
            logger.debug(f"Starting FFmpeg conversion for {ctx.orig_audio_file_path}")

            filters = build_normalization_filters(ctx.audio_info)
            converted = self.wrapper.convert_audio(
                file_path=ctx.orig_audio_file_path,
                output_dir=ctx.intermediate_dir,
                audio_info=ctx.audio_info,
                filters=filters,
            )
            if not converted:
                raise AudioProcessingPipelineError("FFmpeg step produced no outputs")
            ctx.converted_paths = converted

            logger.debug(f"FFmpeg conversion completed: {len(converted)} files")
        except Exception:
            logger.exception("FFmpeg conversion failed")
            raise

    def rollback(self, ctx: ProcessingContext) -> None:
        if ctx.intermediate_dir:
            shutil.rmtree(ctx.intermediate_dir, ignore_errors=True)


class LoudnessMeasurementStep(Step):
    """
    Measures track's loudness in LUFS and dBTP.

    Supports only mono or stereo tracks.
    As a consequence should be ran after the conversion of the user
    input to internal representation (since user input can have multiple channels).
    Can be ran only on one representation of the file (preferrably lossless), since
    after FFmpeg conversion LUFS/dBTP do not vary much from codec to codec.
    """

    def process(self, ctx: ProcessingContext) -> None:
        try:
            target = next(
                # TODO: flac is hardcoded here now and requires the knowledge of codecs used
                # by the ffmpeg step, the fallback to first defined is not ideal; improve
                (p for p in ctx.converted_paths if Path(p).name.startswith("flac-")),
                ctx.converted_paths[0],
            )
            lufs, peak = get_audio_loudness(target)
            ctx.loudness_lufs = lufs
            ctx.true_peak_dbtp = peak
        except Exception:
            logger.exception("Loudness measurement failed")
            raise


class ShakaPackagerStep(Step):
    def __init__(self, shaka_wrapper: ShakaPackagerWrapper = ShakaPackagerMPDAndM3U8):
        self.wrapper = shaka_wrapper

    def process(self, ctx: ProcessingContext) -> None:
        if not ctx.converted_paths:
            raise AudioProcessingPipelineError(
                "No converted files available for packaging"
            )

        try:
            logger.debug(
                f"Starting Shaka Packager with {len(ctx.converted_paths)} input files"
            )

            song_repr = self.wrapper.package_audio_files(
                local_input_paths=[Path(p) for p in ctx.converted_paths],
                storage_dir=ctx.final_dir,
            )
            ctx.song_repr = song_repr

            logger.debug(f"Shaka Packager completed: {ctx.final_dir}")
        except Exception:
            logger.exception("Shaka Packager failed")
            raise

    def rollback(self, ctx: ProcessingContext) -> None:
        if ctx.final_dir:
            delete_django_storage_dir(storage_dir=ctx.final_dir)


class ProcessingResult:
    """
    Returned by the pipeline after a successful run.
    """

    def __init__(self, song_repr: SongRepresentation, context: ProcessingContext):
        self.song_repr = song_repr
        self.context = context
        self.loudness_lufs = context.loudness_lufs
        self.true_peak_dbtp = context.true_peak_dbtp


class ProcessingPipeline:
    def __init__(self, steps: list[Step], do_cleanup: bool = True):
        self.steps = steps
        self.do_cleanup = do_cleanup

    def run(
        self,
        source: str,
        final_storage_dir: str,
        audio_info: AudioStreamInfo,
    ) -> ProcessingResult:
        intermediate_dir = tempfile.mkdtemp()
        ctx = ProcessingContext(
            orig_audio_file_path=source,
            final_dir=str(final_storage_dir),
            intermediate_dir=intermediate_dir,
            audio_info=audio_info,
        )

        executed: list[Step] = []
        try:
            logger.info(f"Starting audio processing pipeline for {source}")
            for step in self.steps:
                step.process(ctx)
                executed.append(step)

            if not ctx.song_repr:
                raise AudioProcessingPipelineError(
                    "Pipeline finished without a SongRepresentation"
                )

            logger.debug("Audio processing pipeline done")
            return ProcessingResult(song_repr=ctx.song_repr, context=ctx)
        except Exception:
            logger.exception(
                f"Audio processing pipeline failed, rolling back {len(executed)} steps"
            )
            for step in reversed(executed):
                step.rollback(ctx)
            raise

        finally:
            if self.do_cleanup:
                shutil.rmtree(ctx.intermediate_dir, ignore_errors=True)


AudioProcessingPipeline = ProcessingPipeline(
    steps=[
        FFmpegStep(FFMPEGFull),
        LoudnessMeasurementStep(),
        ShakaPackagerStep(ShakaPackagerMPDAndM3U8),
    ],
    do_cleanup=True,
)
