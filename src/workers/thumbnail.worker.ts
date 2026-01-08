import { Worker } from "bullmq";
import { redisClient } from "../redis/client";
import { publishEvent } from "../redis/pubsub";
import { videoStatusKey } from "../redis/keys";
import { redisConnection } from "../redis/connection";

console.log("🔥 Thumbnail Worker started");

export const thumbnailWorker = new Worker(
  "video-thumbnail",
  async (job) => {
    const { videoId } = job.data as {
      videoId: string;
    };

    await new Promise((r) => setTimeout(r, 1000));

    await redisClient.hset(videoStatusKey(videoId), {
      stage: "DONE",
      progress: 100,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "DONE",
      progress: 100,
    });
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
