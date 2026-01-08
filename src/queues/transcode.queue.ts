import { Queue } from "bullmq";
import { redisConnection } from "../redis/connection";



export const transcodeQueue = new Queue("video-transcode", {
  connection: redisConnection,
});