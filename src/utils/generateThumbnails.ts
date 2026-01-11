import { spawn } from "child_process";

function generateThumbnail(
  videoPath: string,
  timeInSeconds: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss",
      String(timeInSeconds),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-y",
      outputPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed with code ${code}`));
    });
  });
}

export { generateThumbnail };