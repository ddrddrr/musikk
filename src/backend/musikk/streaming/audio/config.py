# ~2GB, approx. a 32bit 48kHz stereo 90min WAV
MAX_FILE_SIZE = 2 * (1024**3)

MAX_DURATION_SECONDS = 7200  # 2h
# 48khz * 8, realistically we don't want to handle anything more
# in order not to load the system on FFmpeg conversions
MAX_SAMPLE_RATE = 384_000
MAX_CHANNELS = 8  # dolby 7.1 surround

# not adding .ape,.mka and other less popular formats
# since don't want to research their stability and quirks
ALLOWED_FILE_TYPES = {
    "wav",
    "vnd.wav",
    "x-wav",
    "flac",
    "alac",
    "m4a",
    "aiff",
    "aif",
    "mpeg",
    "mp3",
    "ogg",
    "opus",
    "aac",
    "mp4",
}

# run `ffmpeg -codecs | grep '^ .\{2\}A'` for the codecs list
ALLOWED_LOSSY_CODECS = {"mp3", "vorbis", "opus", "aac"}
# there are a ton of pcm codecs, so we do startswith check later on instead of listing them all here
ALLOWED_CODECS = {"pcm", "flac", "alac"} | ALLOWED_LOSSY_CODECS


def is_codec_allowed(codec_name: str) -> bool:
    return any(codec_name.startswith(c) for c in ALLOWED_CODECS)


def is_lossy_codec(codec_name: str) -> bool:
    return any(codec_name.startswith(c) for c in ALLOWED_LOSSY_CODECS)


TARGET_SAMPLE_RATE_44_1 = 44100
SAMPLE_RATE_44_FAMILY = {
    TARGET_SAMPLE_RATE_44_1,
    TARGET_SAMPLE_RATE_44_1 * 2,
    TARGET_SAMPLE_RATE_44_1 * 4,
    TARGET_SAMPLE_RATE_44_1 * 8,
}
TARGET_SAMPLE_RATE_48 = 48000
SAMPLE_RATE_48_FAMILY = {
    TARGET_SAMPLE_RATE_48,
    TARGET_SAMPLE_RATE_48 * 2,
    TARGET_SAMPLE_RATE_48 * 4,
    TARGET_SAMPLE_RATE_48 * 8,
}

DEFAULT_LOSSY_BITRATE = 128  # kbps
