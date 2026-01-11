import ssl
ssl._create_default_https_context = ssl._create_unverified_context

import whisper
import sys

import whisper
import sys
import time

video_path = sys.argv[1]
output_path = sys.argv[2]


def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02}:{m:02}:{s:06.3f}".replace(".", ",")



model = whisper.load_model("base")

print("PROGRESS:5", flush=True)

result = model.transcribe(video_path, verbose=False)

print("PROGRESS:80", flush=True)

with open(output_path, "w") as f:
    for segment in result["segments"]:
        start = segment["start"]
        end = segment["end"]
        text = segment["text"]

        f.write(f"{segment['id'] + 1}\n")
        f.write(f"{format_time(start)} --> {format_time(end)}\n")
        f.write(f"{text}\n\n")

print("PROGRESS:100", flush=True)


def format_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02}:{m:02}:{s:06.3f}".replace(".", ",")
