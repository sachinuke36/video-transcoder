import { Queue } from "bullmq";
import { redisConnection } from "../redis/connection";

export const thumbnailQueue = new Queue("video-thumbnail", {
  connection: redisConnection,
});
