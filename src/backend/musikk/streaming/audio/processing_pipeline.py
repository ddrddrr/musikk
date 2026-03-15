import uuid
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
import logging

from utils.storage import delete_django_storage_dir
from streaming.audio.exceptions import AudioProcessingPipelineError
from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import FFMPEGWrapper, FFMPEGFull
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import (
    ShakaPackagerWrapper,
    ShakaPackagerMPDAndM3U8,
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
    converted_paths: list[str] = field(default_factory=list)
    song_repr: SongRepresentation | None = None


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

            converted = self.wrapper.convert_audio(
                file_path=ctx.orig_audio_file_path, storage_dir=ctx.intermediate_dir
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
            delete_django_storage_dir(storage_dir=ctx.intermediate_dir)


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
                input_storage_paths=ctx.converted_paths, storage_dir=ctx.final_dir
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


class ProcessingPipeline:
    def __init__(self, steps: list[Step], do_cleanup: bool = True):
        self.steps = steps
        self.do_cleanup = do_cleanup

    def run(self, source: str, final_storage_dir: str) -> ProcessingResult:
        intermediate_prefix = f"{final_storage_dir}/tmp_{uuid.uuid4().hex}"
        ctx = ProcessingContext(
            orig_audio_file_path=source,
            final_dir=str(final_storage_dir),
            intermediate_dir=intermediate_prefix,
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

            logger.debug(f"Audio processing pipeline completed successfully")
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
                delete_django_storage_dir(storage_dir=ctx.intermediate_dir)


AudioProcessingPipeline = ProcessingPipeline(
    steps=[FFmpegStep(FFMPEGFull), ShakaPackagerStep(ShakaPackagerMPDAndM3U8)],
    do_cleanup=True,
)
