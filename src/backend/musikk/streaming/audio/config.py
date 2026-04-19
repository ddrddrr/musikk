# 2GB, which approx. corresponds to a 32bit, 48khz, stereo, 90min wav file
MAX_FILE_SIZE = (((2**3) ** 10) ** 2) ** 3

MAX_DURATION_SECONDS = 3600  # 60 min
MAX_SAMPLE_RATE = 705_600  # DSD128 decimated to PCM
MAX_CHANNELS = 8  # 7.1 surround

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
}

# ffprobe -decoders | grep "^ A"
ALLOWED_CODECS = {
    "pcm_f16le",
    "pcm_f24le",
    "pcm_f32be",
    "pcm_f32le",
    "pcm_f64be",
    "pcm_f64le",
    "pcm_s16be",
    "pcm_s16le",
    "pcm_s24be",
    "pcm_s24le",
    "pcm_s32be",
    "pcm_s32le",
    "pcm_s64be",
    "pcm_s64le",
    "pcm_s8",
    "pcm_u16be",
    "pcm_u16le",
    "pcm_u24be",
    "pcm_u24le",
    "pcm_u32be",
    "pcm_u32le",
    "pcm_u8",
    "flac",
    "alac",
}
