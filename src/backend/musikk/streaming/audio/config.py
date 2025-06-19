# 2GB, which approx. corresponds to a 32bit, 48khz, stereo, 90min wav file
MAX_FILE_SIZE = (((2 ** 3) ** 10) ** 2) ** 3

# Only lossless for now
ALLOWED_FILE_TYPES = {
    "wav",
    "vnd.wav",
    "x-wav",
    "bwf",
    "flac",
    "flac",
    "alac",
    "m4a",
    "alac",
    "aiff",
    "aif",
    "aiff",
    "ape",
    "ape",
    "mka",
    "mka",
    "wv",
    "wavpack",
}
