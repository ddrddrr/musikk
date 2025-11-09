import tempfile
from enum import StrEnum
from pathlib import Path
from dataclasses import dataclass

from django.conf import settings

from musikk.utils.cmd import run_shell_command
from musikk.utils.storage import (
    local_dir_to_django_storage,
    delete_django_storage_dir,
    get_django_storage_files,
)


class ManifestType(StrEnum):
    MPD = "mpd"
    M3U8 = "m3u8"


@dataclass(frozen=True)
class SongRepresentation:
    """
    Attributes:
        content_path (str | Path): storage prefix/directory where packaged content was uploaded.
        manifests (dict[ManifestType, str]): mapping from manifest type to storage path.
    """

    content_path: str | Path
    manifests: dict[ManifestType, str]


class ShakaPackagerCommand:
    """
    Command builder for shaka-packager. Mirrors the FFmpegCommand pattern used elsewhere:
    - Responsible only for building the command and returning the expected output paths.
    """

    def __init__(
        self,
        local_paths: list[Path],
        tmpdir: str,
        bin_path: str = settings.SHAKA_PACKAGER_BIN,
    ):
        self.local_paths = local_paths
        self.tmpdir = Path(tmpdir)
        self.bin_path = bin_path

    def build(self) -> tuple[list[str], Path, Path]:
        """
        Build the full shaka-packager command along with the
        MPD and HLS master output Paths located in tmpdir.

        Returns:
            tuple (cmd, mpd_out, hls_master_out)
        """
        inputs_args: list[str] = []
        for i, local in enumerate(self.local_paths):
            out_name = self.tmpdir / f"audio_{i}.mp4"
            arg = f"input={local.as_posix()},stream=audio,output={out_name.as_posix()}"
            inputs_args.append(arg)

        mpd_out = self.tmpdir / "manifest.mpd"
        hls_master_out = self.tmpdir / "master.m3u8"

        cmd: list[str] = [self.bin_path]
        cmd.extend(inputs_args)
        cmd.append(f"--mpd_output={mpd_out.as_posix()}")
        cmd.append(f"--hls_master_playlist_output={hls_master_out.as_posix()}")

        return cmd, mpd_out, hls_master_out


class ShakaPackagerWrapper:
    """
    Wrapper around shaka-packager.
    - Downloads input audio files from Django storage to a temporary directory
    - Runs shaka-packager to produce DASH (MPD) and HLS (M3U8) manifests + segments
    - Uploads the generated files to Django storage under `storage_dir`
    """

    def __init__(
        self,
        do_cleanup: bool = True,
    ):
        self.do_cleanup = do_cleanup

    def package_audio_files(
        self, input_storage_paths: list[str], storage_dir: str | Path
    ) -> SongRepresentation:
        """
        Packages multiple audio files into DASH (MPD) and HLS (M3U8) manifests using shaka-packager.

        Args:
            input_storage_paths: list of paths in Django storage (relative to storage root) to audio files
            storage_dir: storage prefix/directory where output files will be uploaded (e.g. 'audio/song123')

        Returns:
            SongRepresentation with content_path set to storage_dir and manifests mapping.
        """
        assert input_storage_paths, "No input files provided."

        storage_dir = str(storage_dir)
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                local_paths = get_django_storage_files(input_storage_paths, tmpdir)
                cmd, mpd_out, hls_master_out = ShakaPackagerCommand(
                    local_paths=local_paths, tmpdir=tmpdir
                ).build()

                run_shell_command(cmd)

                orig_to_transferred_path_map = local_dir_to_django_storage(
                    local_dir=tmpdir, storage_prefix=storage_dir
                )
                manifests = {
                    ManifestType.MPD: orig_to_transferred_path_map[str(mpd_out)],
                    ManifestType.M3U8: orig_to_transferred_path_map[
                        str(hls_master_out)
                    ],
                }

                return SongRepresentation(content_path=storage_dir, manifests=manifests)
            except Exception:
                if self.do_cleanup:
                    delete_django_storage_dir(storage_dir=storage_dir)
                raise


ShakaPackagerMPDAndM3U8 = ShakaPackagerWrapper()
