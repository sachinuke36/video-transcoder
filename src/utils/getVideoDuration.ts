import { spawn } from "child_process";

function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);

    let output = "";

    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", () => {
      const duration = Number(output.trim());
      if (!duration) {
        reject(new Error("Failed to read video duration"));
      } else {
        resolve(duration);
      }
    });
  });
}

export { getVideoDuration };