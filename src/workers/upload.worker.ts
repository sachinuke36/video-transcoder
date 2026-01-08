import { Worker } from "bullmq";
import fs from "fs";
import { redisClient } from "../redis/client";
import { publishEvent } from "../redis/pubsub";
import { videoStatusKey } from "../redis/keys";
import { redisConnection } from "../redis/connection";
import { transcodeQueue } from "../queues/transcode.queue";

console.log("🔥 Upload Worker started");

export const uploadWorker = new Worker(
  "video-upload",
  async (job) => {
    const { videoId, filePath } = job.data as {
      videoId: string;
      filePath: string;
    };

    if (!fs.existsSync(filePath)) {
      throw new Error("Uploaded file not found");
    }

    const { size: totalSize } = fs.statSync(filePath);

    let processedBytes = 0;
    let lastProgress = 0;

    // UPLOADING START
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "UPLOADING",
      progress: 0,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "UPLOADING",
      progress: 0,
    });

    const stream = fs.createReadStream(filePath, {
      highWaterMark: 1024 * 1024, // 1MB
    });

    for await (const chunk of stream) {
      processedBytes += chunk.length;
      const progress = Math.floor((processedBytes / totalSize) * 100);

      if (progress - lastProgress >= 5) {
        lastProgress = progress;

        await redisClient.hset(videoStatusKey(videoId), { progress });

        await publishEvent(`video:${videoId}:events`, {
          stage: "UPLOADING",
          progress,
        });
      }
    }

    // TRANSITION → TRANSCODING
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "TRANSCODING",
      progress: 0,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "TRANSCODING",
      progress: 0,
    });

    // ENQUEUE NEXT STAGE
    await transcodeQueue.add("transcode-video", {
      videoId,
      filePath,
    });
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
