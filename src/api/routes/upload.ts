import { Request, Router, Response } from "express";
import { v4 as uuid } from "uuid";
import { uploadQueue } from "../../queues/upload.queue";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

router.post('/',uploadMiddleware.single('video') ,async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    
    const videoId = uuid();

    await uploadQueue.add(
        "video-upload",
        {
            videoId,
            filePath: req.file.path,
            filename: req.file.filename,
        },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        }
    )
    
    return res.status(201).json({
      videoId,
      status: "UPLOAD_QUEUED",
    });
})

export default router;