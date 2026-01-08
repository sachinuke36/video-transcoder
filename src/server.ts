import express from "express";
import uploadRoute from "./api/routes/upload";
import statusRoute from "./api/routes/status";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/videos", uploadRoute);
app.use("/videos", statusRoute);


app.listen(3000, () => {
  console.log("API running on port 3000");
});