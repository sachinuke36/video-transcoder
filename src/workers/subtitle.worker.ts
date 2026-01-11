import { Worker } from "bullmq";
import { spawn } from "child_process";
import path from "path";
import { redisConnection as redis } from "../redis/connection";
import { publishEvent } from "../redis/pubsub";
import fs from "fs";

new Worker(
  "video-subtitle",
  async (job) => {
    const { videoId, videoPath } = job.data;



    const outputDir = path.join("storage", videoId);
    if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
    const subtitlePath = path.join(outputDir, "subtitles.srt");

    publishEvent(videoId, {
      stage: "SUBTITLES",
      progress: 0,
    });

    await new Promise<void>((resolve, reject) => {
      const process = spawn("python3", [
        "src/scripts/whisper_runner.py",
        videoPath,
        subtitlePath,
      ]);

      process.stdout.on("data", (data) => {
        const msg = data.toString().trim();

        // Whisper progress messages
        if (msg.startsWith("PROGRESS")) {
          const progress = Number(msg.split(":")[1]);
          publishEvent(`video:${videoId}:events`, {
            stage: "SUBTITLES",
            progress,
          });
        }
      });

      process.stderr.on("data", (data) => {
        console.error(`[WHISPER ERROR]: ${data}`);
      });

      process.on("exit", (code) => {
        if (code === 0) {
          publishEvent(videoId, {
            stage: "SUBTITLES",
            progress: 100,
          });
          resolve();
        } else {
          reject(new Error("Whisper failed"));
        }
      });
    });


    return { subtitlePath };
  },
  {
    connection: redis,
    concurrency: 1,
  }
);

console.log("🔥 Subtitle Worker started");
