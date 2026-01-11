import { Worker } from "bullmq";
import { redisClient } from "../redis/client";
import { publishEvent } from "../redis/pubsub";
import { videoStatusKey } from "../redis/keys";
import { redisConnection } from "../redis/connection";
import fs from 'fs'
import path from "path";
import { spawn } from "child_process";
import { getVideoDuration } from "../utils/getVideoDuration";
import { generateThumbnail } from "../utils/generateThumbnails";
import { subtitleQueue } from "../queues/subtitle.queue";

console.log("🔥 Thumbnail Worker started");

export const thumbnailWorker = new Worker(
  "video-thumbnail",
  async (job) => {
    const { videoId, videoPath } = job.data as {
      videoId: string;
      videoPath: string;
    };

 if(!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist at path: ${videoPath}`);
 }

    const thumbnailDir = path.resolve("thumbnails");
    if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, {recursive: true});
    }

    // const thumbnailPath = path.join(thumbnailDir, `${videoId}-thumbnail.jpg`);
    const duration = await getVideoDuration(videoPath);


    // update redis state
    await redisClient.hset(videoStatusKey(videoId), {
      stage: "THUMBNAIL",
      progress: 0,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "THUMBNAIL",
      progress: 0,
    });

    const percentages = [0.1, 0.5, 0.9];
    const timestamps = percentages.map(p => Math.floor(duration * p));

    for (let i = 0; i < timestamps.length; i++) {
      const time = timestamps[i];
      const outputPath = path.join(
        thumbnailDir,
        `${videoId}-thumb-${i + 1}.jpg`
      );

      await generateThumbnail(videoPath, time, outputPath);

      const progress = Math.round(((i + 1) / timestamps.length) * 100);

      await redisClient.hset(videoStatusKey(videoId), {
        stage: "THUMBNAIL",
        progress,
      });

      await publishEvent(`video:${videoId}:events`, {
        stage: "THUMBNAIL",
        progress,
      });
    }
      
   

    await redisClient.hset(videoStatusKey(videoId), {
      stage: "DONE",
      progress: 100,
    });

    await publishEvent(`video:${videoId}:events`, {
      stage: "SUBTITLE_QUEUED",
      progress: 100,
    });


await subtitleQueue.add("generate-subtitle", {
  videoId,
  videoPath,
},{
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
  });

  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);
