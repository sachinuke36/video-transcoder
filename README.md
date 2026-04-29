# Distributed Video Processing Pipeline

A production-style distributed backend system that processes uploaded videos asynchronously using **Redis**, **BullMQ**, **Node.js (TypeScript)**, **FFmpeg**, and **OpenAI Whisper (Python)**.

This project demonstrates how real-world platforms (like YouTube/Vimeo) handle large uploads, CPU-heavy workloads, fault tolerance, and real-time progress tracking.

---

## Key Features

- Asynchronous video processing using background workers
- Real-time progress updates via Redis Pub/Sub
- Automatic retries with exponential backoff
- Multi-stage processing pipeline:
  - Upload handling with progress tracking
  - Video transcoding to 360p
  - Thumbnail generation (3 frames)
  - Subtitle generation using OpenAI Whisper
- Docker-ready setup (Node + Python + Redis + FFmpeg)
- RESTful API for upload and status tracking

---

## Architecture

```
Client
  |
  | POST /videos (multipart/form-data)
  v
API Server (Express - Port 3000)
  |
  | enqueue job
  v
Redis (BullMQ - Port 6379)
  |
  +---> Upload Worker (video-upload queue)
          |
          +---> Transcode Worker (video-transcode queue)
                  |
                  +---> Thumbnail Worker (video-thumbnail queue)
                          |
                          +---> Subtitle Worker (video-subtitle queue)
                                  |
                                  v
                               DONE
```

---

## API Endpoints

### Upload Video

**POST** `/videos`

Upload a video file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `video`
- Max file size: **100MB**

**Response:**
```json
{
  "videoId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "UPLOAD_QUEUED"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/videos \
  -F "video=@/path/to/video.mp4"
```

---

### Get Video Status

**GET** `/videos/:videoId/status`

Get the current processing status and progress of a video.

**Response:**
```json
{
  "videoId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "TRANSCODING",
  "progress": 75
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `UPLOAD_QUEUED` | Video upload job queued |
| `UPLOADING` | Processing uploaded file |
| `TRANSCODING` | Converting video to 360p |
| `THUMBNAIL` | Generating thumbnails |
| `SUBTITLES` | Generating subtitles with Whisper |
| `DONE` | All processing complete |

---

## Processing Pipeline

### Stage 1: Upload
- Client uploads video using `multipart/form-data`
- File saved to `uploads/` directory with timestamp prefix
- Progress tracked in 5% increments
- File read in 1MB chunks for progress calculation

### Stage 2: Transcoding
- Video converted to **360p resolution** (640x480 max, aspect ratio preserved)
- Output format: `.mov` container
- Video codec: **H.264** (libx264)
- Audio codec: **AAC**
- Encoding preset: **veryfast**
- FFmpeg stderr parsed for real-time progress
- Output saved to `processed/{videoId}-360p.mov`

### Stage 3: Thumbnail Generation
- 3 thumbnails extracted at:
  - 10% of video duration
  - 50% of video duration
  - 90% of video duration
- Output format: JPEG
- Saved to `thumbnails/{videoId}-thumb-{1,2,3}.jpg`

### Stage 4: Subtitle Generation
- Audio transcribed using **OpenAI Whisper** (base model)
- Output format: **SRT** (SubRip)
- Saved to `storage/{videoId}/subtitles.srt`
- Runs as Python subprocess

### Stage 5: Done
- Final status stored in Redis
- All artifacts available for retrieval

---

## Project Structure

```
video-transcoder/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── upload.ts          # POST /videos endpoint
│   │   │   └── status.ts          # GET /videos/:videoId/status
│   │   └── middleware/
│   │       └── upload.ts          # Multer config (100MB limit)
│   ├── workers/
│   │   ├── upload.worker.ts       # File upload processor
│   │   ├── transcode.worker.ts    # FFmpeg video conversion
│   │   ├── thumbnail.worker.ts    # Thumbnail extraction
│   │   ├── subtitle.worker.ts     # Whisper subtitle generation
│   │   └── subtitles-embed.worker.ts  # (Not integrated)
│   ├── queues/
│   │   ├── upload.queue.ts        # video-upload queue
│   │   ├── transcode.queue.ts     # video-transcode queue
│   │   ├── thumbnail.queue.ts     # video-thumbnail queue
│   │   ├── subtitle.queue.ts      # video-subtitle queue
│   │   └── subtitleEmbed.queue.ts # subtitle-embed queue
│   ├── redis/
│   │   ├── client.ts              # IORedis client
│   │   ├── connection.ts          # BullMQ connection config
│   │   ├── keys.ts                # Redis key conventions
│   │   └── pubsub.ts              # Pub/Sub utilities
│   ├── types/
│   │   └── jobs.ts                # TypeScript interfaces
│   ├── utils/
│   │   ├── getVideoDuration.ts    # FFprobe duration extraction
│   │   └── generateThumbnails.ts  # FFmpeg thumbnail utility
│   ├── scripts/
│   │   ├── listen.ts              # Redis event listener
│   │   ├── clearQueues.ts         # Queue clearing utility
│   │   └── whisper_runner.py      # Python Whisper wrapper
│   └── server.ts                  # Express API server
├── uploads/                       # Original uploaded videos
├── processed/                     # Transcoded videos
├── thumbnails/                    # Generated thumbnails
├── storage/                       # Subtitle files
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Quick Start with Docker

Run everything with a single command:

```bash
docker compose up --build
```

This starts:
- Redis server (port 6379)
- API server (port 3000)
- All background workers
- Python + Whisper environment
- FFmpeg runtime

**Test the API:**
```bash
# Upload a video
curl -X POST http://localhost:3000/videos -F "video=@sample.mp4"

# Check status (replace with your videoId)
curl http://localhost:3000/videos/YOUR_VIDEO_ID/status
```

---

## Local Development

### Prerequisites
- Node.js v20+
- Redis server running locally
- FFmpeg and FFprobe installed
- Python 3 with OpenAI Whisper (`pip install openai-whisper`)

### Installation

```bash
# Install dependencies
npm install

# Create required directories
mkdir -p uploads processed thumbnails storage
```

### Running Services

**Run all services concurrently:**
```bash
npm run dev:all
```

**Or run services individually:**
```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Start upload worker
npm run upload-worker

# Terminal 3: Start transcode worker
npm run transcode-worker

# Terminal 4: Start thumbnail worker
npm run thumbnail-worker

# Terminal 5: Start subtitle worker
npm run subtitle-worker

# Terminal 6: (Optional) Start event listener
npm run listener
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run api` | Start Express API server |
| `npm run upload-worker` | Start upload processing worker |
| `npm run transcode-worker` | Start video transcoding worker |
| `npm run thumbnail-worker` | Start thumbnail generation worker |
| `npm run subtitle-worker` | Start subtitle generation worker |
| `npm run listener` | Start Redis event listener |
| `npm run dev:all` | Run all services concurrently |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `127.0.0.1` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |

In Docker, these are automatically configured:
```env
REDIS_HOST=redis
REDIS_PORT=6379
```

### Processing Settings

| Setting | Value |
|---------|-------|
| Max upload size | 100MB |
| Output resolution | 360p (640x480 max) |
| Output format | .mov (H.264 + AAC) |
| Encoding preset | veryfast |
| Thumbnail count | 3 |
| Whisper model | base |
| Subtitle format | SRT |

### Worker Configuration

All workers configured with:
- **Concurrency:** 1 (CPU-bound operations)
- **Retry attempts:** 3
- **Backoff:** Exponential (2000ms base delay)

---

## Real-Time Progress Updates

Progress is tracked via Redis:

**Status Storage:**
```
HSET video:{videoId}:status stage "TRANSCODING" progress 45
```

**Event Publishing:**
```
PUBLISH video:{videoId}:events {"stage":"TRANSCODING","progress":45}
```

**Subscribe to Events:**
```
PSUBSCRIBE video:*:events
```

---

## Output Files

| Directory | Contents | Naming Convention |
|-----------|----------|-------------------|
| `uploads/` | Original videos | `{timestamp}-{originalName}` |
| `processed/` | Transcoded videos | `{videoId}-360p.mov` |
| `thumbnails/` | Generated thumbnails | `{videoId}-thumb-{1,2,3}.jpg` |
| `storage/{videoId}/` | Subtitles | `subtitles.srt` |

---

## Tech Stack

**Backend:**
- Node.js v20
- TypeScript 5.9
- Express 5.2

**Queue & State:**
- Redis 7
- BullMQ 5.66
- IORedis 5.9

**Media Processing:**
- FFmpeg (transcoding, thumbnails)
- FFprobe (metadata extraction)
- OpenAI Whisper (speech-to-text)

**Infrastructure:**
- Docker
- Docker Compose

---

## Dependencies

### Production
- `bullmq` - Job queue system
- `express` - Web framework
- `ioredis` - Redis client
- `multer` - File upload handling
- `uuid` - Video ID generation
- `ws` - WebSocket support

### Development
- `typescript` - Type checking
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on changes
- `concurrently` - Run multiple processes

---

## Why This Architecture?

### Problem
Processing videos synchronously would:
- Block the server for minutes
- Crash on large files
- Lose progress on restart
- Prevent horizontal scaling

### Solution
- **Background jobs:** Offload processing to workers
- **Redis persistence:** Survive crashes and restarts
- **BullMQ coordination:** Handle retries, concurrency, failures
- **Pub/Sub updates:** Real-time progress without polling

---

## Known Limitations

- Subtitle embedding into video not implemented
- Single resolution output only (360p)
- No resumable uploads
- CPU-only processing (no GPU acceleration)
- Local filesystem storage only

---

## Future Improvements

- Embed subtitles into final video
- Multiple resolution outputs (240p, 720p, 1080p)
- Cloud storage integration (S3/GCS)
- Web dashboard for monitoring
- Kubernetes deployment
- GPU acceleration for transcoding
- Resumable/chunked uploads
- Video preview generation

---

## License

MIT
