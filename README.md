# 🎥 Distributed Video Processing Pipeline (Redis + BullMQ + FFmpeg)

A production-grade backend system for **uploading, processing, and transcoding videos asynchronously**, with **real-time progress tracking**, **job chaining**, and **Redis-backed state**.

This project demonstrates how real media platforms handle long-running, CPU-intensive video workloads without blocking APIs.

---

## 🚀 Features

- Real video upload (multipart)
- Asynchronous background processing using **BullMQ**
- **Redis** as the single source of truth
- Real-time progress updates via **Redis Pub/Sub**
- Multi-stage job pipeline (Upload → Transcode → Thumbnail)
- **Real FFmpeg transcoding** (no simulation)
- CPU-bound workers with controlled concurrency
- One-command local orchestration
- Fault-tolerant, restart-safe architecture

---

## 🧠 Architecture Overview

Client  
→ API (Express)  
→ Upload Queue (BullMQ)  
→ Upload Worker  
→ Transcode Queue  
→ Transcode Worker (FFmpeg)  
→ Thumbnail Queue  
→ Thumbnail Worker  
→ DONE  

---

## 🧩 Tech Stack

- Node.js + TypeScript  
- Express  
- BullMQ  
- Redis  
- FFmpeg  
- Multer  
- concurrently  

---

## 📦 Pipeline Stages

### Upload
- Accepts multipart upload
- Streams file to disk
- Tracks byte-level progress

### Transcoding
- Converts uploaded video to **360p `.mov`**
- Parses FFmpeg stderr for real progress
- CPU-bound worker

### Thumbnail
- Final stage
- Marks job as complete

---

## 📊 Progress Tracking

### Redis Pub/Sub
```json
{ "stage": "TRANSCODING", "progress": 55 }
```

### Status API
```
GET /videos/:videoId/status
```

---

## 🖥️ Running the Project

### Prerequisites
- Node.js ≥ 18
- Redis running locally
- FFmpeg installed

```bash
brew install ffmpeg
```

### Install
```bash
npm install
```

### Run everything
```bash
npm run dev:all
```

---

## 📁 Output

```
processed/
 └── <videoId>-360p.mov
```

---

## 🎯 Why This Project Matters

This project demonstrates:
- Distributed systems design
- Async job orchestration
- CPU-bound background processing
- Event-driven architecture
- Real media pipelines

---

## 🔮 Future Improvements

- Multiple resolutions
- Real thumbnail extraction
- Retry & DLQ handling
- Bull Board dashboard
- Docker Compose
- HLS streaming

---

Built with ❤️ using Redis & BullMQ
