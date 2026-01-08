import { subscriber } from "../redis/pubsub";

subscriber.psubscribe("video:*");

subscriber.on("pmessage", (_pattern, channel, message) => {
  console.log(`[${channel}]`, message);
});

console.log("Listening for video events...");
