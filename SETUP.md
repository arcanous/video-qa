# Video QA Platform Setup

## Overview
This is a video processing platform that allows users to upload videos and query them using AI. The system consists of:

- **Next.js Frontend** (`video-qa/`): Upload interface and status monitoring
- **Python Worker** (`video-worker/`): Video processing pipeline (transcription, scene detection, vision analysis, embeddings)
- **PostgreSQL Database**: Shared schema with pgvector for embeddings

## Quick Start

### 1. Build the Worker Image
```bash
# From video-qa directory
cd ../video-worker
docker build -t videoqa-worker:0.0.3 .
cd ../video-qa
```

### 2. Create Environment File
Create `.env.local` in the `video-qa` directory:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/videoqa
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start the Database and Worker
```bash
docker-compose up -d
```

### 4. Start the Next.js App
```bash
npm install
npm run dev
```

## Architecture

### Database Schema
- `videos`: Stores video metadata (original_path, normalized_path, status, etc.)
- `jobs`: Processing queue with status tracking
- `scenes`: Scene boundaries detected in videos
- `frames`: Extracted frames from scenes
- `transcript_segments`: Audio transcription with embeddings
- `frame_captions`: Vision analysis of frames with embeddings

### Processing Pipeline
1. **Upload**: Video saved to `data/uploads/`, metadata stored in `videos.original_path`
2. **Job Creation**: Processing job enqueued in `jobs` table
3. **Worker Processing**:
   - Normalize video (720p, 30fps)
   - Transcribe audio using OpenAI Whisper
   - Detect scenes using PySceneDetect
   - Extract representative frames
   - Analyze frames with GPT-4 Vision
   - Generate embeddings for search
4. **Completion**: Video status set to 'ready'

### Key Fixes Applied
- **Path Resolution**: Fixed duplicate `/data/data/` paths by storing relative paths
- **Schema Consistency**: Added `original_path`, `original_name`, `size_bytes` columns
- **Status Tracking**: Videos now show 'processing' status during worker execution
- **Idempotency**: Added `ON CONFLICT` handling for re-runs
- **Health Monitoring**: Fixed SQL joins in worker health endpoints

## Development

### Worker Health Endpoints
When `WORKER_DEV_HTTP=true` in environment:
- `GET /healthz`: Health check
- `GET /jobs/peek`: View pending jobs
- `GET /stats`: Processing statistics

### File Structure
```
video-qa/
├── src/app/api/upload/          # Upload endpoint
├── src/app/(app)/upload/        # Upload UI
├── lib/db.ts                   # Database functions
├── lib/file.ts                 # File handling
└── docker/initdb/              # Database schema

video-worker/
├── worker/
│   ├── db.py                   # Database operations
│   ├── run.py                  # Main worker loop
│   └── pipeline/               # Processing modules
└── Dockerfile                  # Worker container
```

## Troubleshooting

### Common Issues
1. **Worker can't find video files**: Check that `DATA_DIR` is correctly mounted
2. **Database connection errors**: Ensure PostgreSQL is running and accessible
3. **OpenAI API errors**: Verify `OPENAI_API_KEY` is set correctly
4. **Path resolution issues**: Check that uploads use relative paths (`uploads/...` not `data/uploads/...`)

### Logs
- Worker logs: `data/worker/log.log`
- Database logs: Check `docker-compose logs postgres`
- Next.js logs: Check terminal output

### Reset Database
```bash
docker-compose down
rm -rf data/postgres
docker-compose up -d
```
