
# 🎬 Distributed Video Processing Pipeline (Docker Ready)

This project is a **production-style distributed backend system** that processes uploaded videos asynchronously using **Redis**, **BullMQ**, **Node.js (TypeScript)**, **FFmpeg**, and **OpenAI Whisper (Python)**.

It demonstrates how real-world platforms (like YouTube / Vimeo) handle **large uploads**, **CPU-heavy workloads**, **fault tolerance**, and **real-time progress tracking**.

---

## ✨ Key Features

- Asynchronous video processing using background workers
- Real-time progress updates via Redis Pub/Sub
- Automatic retries and failure recovery
- Multi-stage pipeline:
  - Upload
  - Transcoding
  - Thumbnail generation
  - Subtitle generation
- Docker-ready setup (Node + Python + Redis + FFmpeg)

---

## 🧠 Why This Project Exists

Uploading and processing videos is **slow and expensive**.  
Doing it inside a single HTTP request would:

- Block the server
- Crash on large files
- Lose progress on restart

This project solves that by:
- Offloading work to **background jobs**
- Persisting state in **Redis**
- Allowing workers to crash and recover safely

---

## 🏗️ High-Level Architecture

```
Client
  |
  | POST /videos
  v
API Server (Express)
  |
  | enqueue job
  v
Redis (BullMQ)
  |
  +--> Upload Worker
        |
        +--> Transcode Worker (FFmpeg)
              |
              +--> Thumbnail Worker
                    |
                    +--> Subtitle Worker (Whisper)
```

---

## 🔄 Processing Pipeline (Step-by-Step)

### 1️⃣ Upload Stage
- Client uploads video using `multipart/form-data`
- File saved to disk using Multer
- Upload job is added to BullMQ
- Progress is streamed in real time

**Stage:** `UPLOADING`

---

### 2️⃣ Transcoding Stage
- Video is converted to **360p `.mov`**
- Uses FFmpeg
- FFmpeg logs are parsed to calculate progress

**Stage:** `TRANSCODING`

---

### 3️⃣ Thumbnail Generation
- 3 thumbnails generated at:
  - 10%
  - 50%
  - 90% of video duration
- Stored on disk

**Stage:** `THUMBNAIL`

---

### 4️⃣ Subtitle Generation
- Subtitles generated using **OpenAI Whisper**
- Executed via Python worker
- Outputs `.srt` file

**Stage:** `SUBTITLES`

> ⚠️ Subtitle embedding into video is NOT implemented yet.

---

### 5️⃣ Completion
- Final state stored in Redis
- Job marked as done

**Stage:** `DONE`

---

## ⚙️ Why Redis?

Redis acts as the **central brain** of the system.

Used for:
- Job queues (BullMQ backend)
- Persisting job state & progress
- Pub/Sub for real-time updates
- Crash recovery

Without Redis:
- Progress would reset on restart
- Failed jobs would be lost
- Scaling workers would be impossible

---

## 🔁 Why BullMQ?

BullMQ handles:
- Background jobs
- Worker coordination
- Retries with exponential backoff
- Crash detection
- Concurrency limits

If a worker crashes at 30% → BullMQ retries the job.

---

## 📡 Real-Time Progress Updates

- Progress stored using `HSET` in Redis
- Events published via Redis `PUBLISH`
- Listener subscribes using `PSUBSCRIBE`

Example event:
```json
{
  "stage": "TRANSCODING",
  "progress": 70
}
```

---

## 🧰 Tech Stack

**Backend**
- Node.js
- TypeScript
- Express

**Queue & State**
- Redis
- BullMQ

**Media**
- FFmpeg
- OpenAI Whisper

**Infra**
- Docker
- Docker Compose

---

## 📂 Project Structure

```
src/
 ├── api/
 │   ├── routes/
 │   └── middleware/
 ├── workers/
 │   ├── upload.worker.ts
 │   ├── transcode.worker.ts
 │   ├── thumbnail.worker.ts
 │   └── subtitle.worker.ts
 ├── queues/
 ├── redis/
 ├── scripts/
 └── utils/

uploads/
processed/
thumbnails/
storage/
```

---

## 🐳 Docker Usage

Everything runs with one command:

```bash
docker compose up --build
```

This starts:
- Redis
- API server
- All workers
- Python + Whisper
- FFmpeg

No local setup required.

---

## 🔐 Environment Variables

Handled automatically in Docker.

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 🚧 Known Limitations

- Subtitle embedding not implemented
- No resumable uploads
- Single resolution output
- CPU-only processing

---

## 🔮 Future Improvements

- Embed subtitles into video
- Multiple resolutions (240p, 720p, 1080p)
- Cloud storage (S3 / GCS)
- Frontend dashboard
- Kubernetes deployment

---

## ✅ Why This Project Matters

This is **not a toy project**.

It demonstrates:
- Distributed system design
- Async job processing
- Crash recovery
- Cross-language workers (Node + Python)
- Real-world backend patterns

---

## 🏁 Final Note

This project mirrors **real production pipelines** used in video platforms.

You now have:
- A scalable architecture
- Fault-tolerant processing
- Real-time observability

🚀 Ready for GitHub.
