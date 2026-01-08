import { redisClient } from "./client";

export const publisher = redisClient.duplicate();
export const subscriber = redisClient.duplicate();


export const publishEvent = async (channel:string, message:object)=>{
    await publisher.publish(channel, JSON.stringify(message));
}