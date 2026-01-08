import { Queue } from "bullmq";
import { redisConnection } from "../redis/connection";

export const uploadQueue = new Queue("video-upload",{
    connection: redisConnection,
})