import { Worker } from "bullmq";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { redisClient } from "../redis/client";
import { publishEvent } from "../redis/pubsub";
import { videoStatusKey } from "../redis/keys";
import { redisConnection } from "../redis/connection";
import { thumbnailQueue } from "../queues/thumbnail.queue";

console.log("🔥 Transcode Worker (REAL FFmpeg) started");

export const transcodeWorker = new Worker(
  "video-transcode",
  async (job) => {
    const { videoId, filePath } = job.data as {
      videoId: string;
      filePath: string;
    };

    // 1️⃣ Validate input
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input video not found: ${filePath}`);
    }

    // 2️⃣ Ensure output directory exists
    const outputDir = path.resolve("processed");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 3️⃣ Output path (.mov + 360p)
    const outputPath = path.join(
      outputDir,
      `${videoId}-360p.mov`
    );

    // 4️⃣ Update Redis state
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "TRANSCODING",
      progress: 0,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "TRANSCODING",
      progress: 0,
    });

    // 5️⃣ Spawn FFmpeg
    const ffmpeg = spawn("ffmpeg", [
      "-i", filePath,

      // 360p (preserve aspect ratio)
      "-vf", "scale=640:-2",

      // Video + audio codecs
      "-c:v", "libx264",
      "-c:a", "aac",

      // Faster encoding
      "-preset", "veryfast",

      // Optimize for streaming
      "-movflags", "+faststart",

      "-y",
      outputPath,
    ]);

    let durationInSeconds = 0;

    // 6️⃣ Parse FFmpeg progress
    ffmpeg.stderr.on("data", (data) => {
      const msg = data.toString();

      // Read duration once
      const durationMatch = msg.match(
        /Duration:\s(\d+):(\d+):(\d+\.\d+)/
      );
      if (durationMatch && durationInSeconds === 0) {
        const [, h, m, s] = durationMatch;
        durationInSeconds =
          Number(h) * 3600 +
          Number(m) * 60 +
          Number(s);
      }

      // Read current time
      const timeMatch = msg.match(
        /time=(\d+):(\d+):(\d+\.\d+)/
      );
      if (timeMatch && durationInSeconds > 0) {
        const [, h, m, s] = timeMatch;
        const current =
          Number(h) * 3600 +
          Number(m) * 60 +
          Number(s);

        const progress = Math.min(
          Math.floor((current / durationInSeconds) * 100),
          99
        );

        redisClient.hset(videoStatusKey(videoId), {
          progress,
        });

        publishEvent(`video:${videoId}:events`, {
          stage: "TRANSCODING",
          progress,
        });
      }
    });

    // 7️⃣ Wait for FFmpeg to finish
    await new Promise<void>((resolve, reject) => {
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
    });

    // 8️⃣ Verify output file is real
    const stats = fs.statSync(outputPath);
    console.log("✅ Transcoded file size:", stats.size);

    if (stats.size === 0) {
      throw new Error("FFmpeg output file is empty");
    }

    // 9️⃣ Transition → THUMBNAIL
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "THUMBNAIL",
      progress: 0,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "THUMBNAIL",
      progress: 0,
    });

    // 🔟 Enqueue thumbnail job
    await thumbnailQueue.add("generate-thumbnail", {
      videoId,
      videoPath: outputPath,
    });
  },
  {
    connection: redisConnection,
    concurrency: 1, // CPU-bound
  }
);
