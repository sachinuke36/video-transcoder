import { Queue } from "bullmq";
import { redisConnection } from "../redis/connection";

export const subtitleEmbedQueue = new Queue(
  "subtitle-embed",
  { connection: redisConnection }
);
