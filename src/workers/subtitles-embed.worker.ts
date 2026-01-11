import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redisConnection } from "../redis/connection";
import { redisClient } from "../redis/client";
import { publishEvent } from "../redis/pubsub";
import { videoStatusKey } from "../redis/keys";

console.log("🔥 Subtitle Embed Worker started");

export const subtitleEmbedWorker = new Worker(
  "subtitle-embed",
  async (job) => {
    const { videoId, videoPath, subtitlePath } = job.data as {
      videoId: string;
      videoPath: string;
      subtitlePath: string;
    };

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video not found: ${videoPath}`);
    }

    if (!fs.existsSync(subtitlePath)) {
      throw new Error(`Subtitle not found: ${subtitlePath}`);
    }

    const outputDir = path.resolve("final");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(
      outputDir,
      `${videoId}-subtitled.mov`
    );

    // Update state
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "EMBED_SUBTITLES",
      progress: 0,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "EMBED_SUBTITLES",
      progress: 0,
    });

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", videoPath,
        "-i", subtitlePath,

        // Copy video/audio (no re-encode)
        "-c", "copy",

        // Subtitle codec for MOV
        "-c:s", "mov_text",

        "-y",
        outputPath,
      ]);

      ffmpeg.stderr.on("data", (data) => {
        // Optional: log FFmpeg output
        // console.log(data.toString());
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with ${code}`));
      });
    });

    // Done
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "DONE",
      progress: 100,
      outputPath,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "DONE",
      progress: 100,
    });

    return { outputPath };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
