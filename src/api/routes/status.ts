import { Request, Response, Router } from "express";
import { redisClient } from "../../redis/client";
import { videoStatusKey } from "../../redis/keys";



const router = Router();


router.get("/:videoId/status", async(req: Request, res: Response)=>{
    const { videoId } = req.params;

    const data = await redisClient.hgetall(videoStatusKey(videoId));

    if (!data || Object.keys(data).length === 0) {
    return res.status(404).json({
      error: "Video not found",
    });
  }

  return res.json({
    videoId,
    status: data.status,
    progress: Number(data.progress ?? 0),
  });
})

export default router;