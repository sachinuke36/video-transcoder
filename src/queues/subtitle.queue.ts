import { Queue } from "bullmq";
import { redisConnection } from "../redis/connection";



export const subtitleQueue = new Queue("video-subtitle", {
  connection: redisConnection,
});