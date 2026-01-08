import multer from "multer";


const storage = multer.diskStorage({
    destination: (_req, _file, cb)=>{
        cb(null, 'uploads/');
    },
    filename: (_req, file, cb)=>{
            const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
})

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});