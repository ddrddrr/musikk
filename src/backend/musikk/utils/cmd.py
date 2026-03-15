import subprocess
import shlex


def run_shell_command(
    command: list[str], timeout: int = 60
) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            command, capture_output=True, text=True, timeout=timeout, check=True
        )
    except subprocess.TimeoutExpired as exc:
        exc.add_note(f"timeout after {exc.timeout}s; cmd={shlex.join(command)}")
        if getattr(exc, "stderr", None):
            exc.add_note(f"stderr (tail): {exc.stderr[-200:]}")
        raise
    except subprocess.CalledProcessError as exc:
        exc.add_note(f"rc={exc.returncode}; cmd={shlex.join(command)}")
        if exc.stderr:
            exc.add_note(f"stderr (tail): {exc.stderr[-200:]}")
        if exc.stdout:
            exc.add_note(f"stdout (tail): {exc.stdout[-200:]}")
        raise
