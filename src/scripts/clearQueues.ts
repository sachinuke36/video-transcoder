import { uploadQueue } from "../queues/upload.queue";
import { transcodeQueue } from "../queues/transcode.queue";
import { thumbnailQueue } from "../queues/thumbnail.queue";
import { subtitleQueue } from "../queues/subtitle.queue";

async function clear() {
  await uploadQueue.drain(true);
  await transcodeQueue.drain(true);
  await thumbnailQueue.drain(true);
  await subtitleQueue.drain(true);

  console.log("✅ All queues cleared");
  process.exit(0);
}

clear();
