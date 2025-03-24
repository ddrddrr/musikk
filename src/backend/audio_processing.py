import subprocess

# Input and output paths
input_wav = "narayan.flac"
output_audio = "output_audio%03d.m4a"  # Segmented output files
codec = "libvorbis"
bitrate = "320k"
# Command to convert and segment the .wav file, and generate the MPD
command = [
    "ffmpeg",
    "-i", input_wav,         # Input file
    "-c:a", codec,     # Vorbis codec
    "-b:a", bitrate,          # Set bitrate to 320kbps
    "-f", "dash",            # Format to DASH (MPD)
    "-segment_time", "10",   # Segment length (10 seconds)
    "-y",                    # Overwrite output files
    output_audio,            # Segmented output file format
    "-use_timeline", "1",    # Use timeline in MPD
    "-use_template", "1",    # Use template for chunk names
    "-init_seg_name", "init.mp4",  # Initialization segment name
    "-media_seg_name", "chunk_$Number$.m4a",  # Media segment pattern
    input_wav.removesuffix(".flac") + ".mpd"  # Output MPD file
]

# Join the command list into a single string (for logging or debugging)
command_str = ' '.join(command)
print("Running command:", command_str)

# Run the FFmpeg command
subprocess.run(command, check=True)
