import express from "express";
import uploadRoute from "./api/routes/upload";
import statusRoute from "./api/routes/status";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 uploads/ directory created");
}

app.use("/videos", uploadRoute);
app.use("/videos", statusRoute);


app.listen(3000, () => {
  console.log("API running on port 3000");
});