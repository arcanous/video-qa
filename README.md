# Video QA Platform

An AI-powered video processing platform that allows users to upload instructional videos and ask questions about them using natural language. Features multimodal search across video content, frame analysis, and intelligent chat interface.

## Features

- **Video Upload**: Drag-and-drop interface with real-time processing status
- **AI Chat Interface**: Ask questions about uploaded videos with streaming responses
- **Multimodal Search**: Search across transcripts, frames, and uploaded images
- **Frame Analysis**: Automatic scene detection and frame extraction with AI vision
- **Authentication**: Simple demo authentication system
- **Real-time Processing**: Live status updates during video processing

## System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Next.js App │─────▶│  PostgreSQL │
│             │      │  (video-qa)  │      │  + pgvector │
└─────────────┘      └──────────────┘      └──────┬──────┘
                            │                      │
                            │ writes               │ polls
                            │ video +              │ jobs
                            │ job                  │
                            ▼                      ▼
                     ┌─────────────┐      ┌──────────────┐
                     │ data/       │      │   Worker     │
                     │ uploads/    │◀─────│ (video-      │
                     │ processed/  │      │  worker)     │
                     │ frames/     │      └──────────────┘
                     └─────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Docker and Docker Compose
- OpenAI API key

### 1. Setup Environment
```bash
# Clone both repositories
git clone <video-qa-repo>
git clone <video-worker-repo>

# Create environment file
cd video-qa
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/videoqa
OPENAI_KEY=your_openai_api_key_here
EOF
```

### 2. Build and Start Services
```bash
# Build worker image
cd ../video-qa-worker
docker build -t videoqa-worker:0.0.19 .

# Start database and worker
cd ../video-qa
docker-compose up -d

# Start Next.js app
pnpm install
pnpm dev
```

### 3. Login and Upload
1. Open http://localhost:3000
2. Login with demo credentials: `demo` / `demo123`
3. Upload a video file (max 500MB)
4. Monitor processing status
5. Ask questions about your video

## How It Works

### Upload Flow
1. **File Upload**: Video saved to `data/uploads/{id}_{name}.mp4`
2. **Database**: Metadata stored in `videos` table with `original_path`
3. **Job Queue**: Processing job created in `jobs` table
4. **Worker**: Polls for jobs using `FOR UPDATE SKIP LOCKED`

### Processing Pipeline
The worker processes videos through 6 stages:

```
Input: uploads/{id}_{name}.mp4
  │
  ├─▶ [1. NORMALIZE] → processed/{id}/normalized.mp4
  │                  → processed/{id}/audio.wav
  │
  ├─▶ [2. TRANSCRIBE] → transcript_segments table
  │                    → subs/{id}.srt
  │
  ├─▶ [3. SCENES] → scenes table (t_start, t_end)
  │
  ├─▶ [4. FRAMES] → frames/{id}/scene_*.jpg
  │               → frames table (phash, path)
  │
  ├─▶ [5. VISION] → frame_captions table (caption, entities)
  │
  └─▶ [6. EMBEDDINGS] → UPDATE embeddings (1536-dim vectors)

Output: video.status = 'ready'
```

## Database Schema

### Core Tables
- **`videos`**: Video metadata (original_path, normalized_path, status, duration)
- **`jobs`**: Processing queue with status tracking
- **`scenes`**: Scene boundaries detected in videos
- **`frames`**: Extracted frames with perceptual hashes
- **`transcript_segments`**: Audio transcription with embeddings
- **`frame_captions`**: Vision analysis with embeddings

### Key Relationships
```
videos (1) ──→ (many) jobs
videos (1) ──→ (many) scenes
scenes (1) ──→ (many) frames
frames (1) ──→ (1) frame_captions
videos (1) ──→ (many) transcript_segments
```

## API Endpoints

### Authentication
- **POST** `/login` - Login with demo credentials
- **Response**: Redirect to upload page

### Upload
- **POST** `/api/upload` - Upload video file
- **Response**: `{ id: string }`

### Video Management
- **GET** `/api/videos` - List all videos
- **GET** `/api/videos/[id]/status` - Get processing status
- **GET** `/api/videos/[id]/summary` - Get processing results

### Chat Interface
- **POST** `/api/ask` - Ask questions about videos
- **POST** `/api/ask/upload-image` - Upload image for multimodal search
- **Response**: Streaming text response

### Frame Images
- **GET** `/api/frames/[videoId]/[frameNum]` - Serve frame images
- **Response**: JPEG image with caching headers

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `OPENAI_KEY` | ✅ | - | OpenAI API key for AI processing |
| `NODE_ENV` | ❌ | development | Environment mode |

## File Storage Strategy

### Path Resolution
- **Stored in DB**: Relative paths like `uploads/{id}_{name}.mp4`
- **Resolved by Worker**: `{DATA_DIR}/{relative_path}` → absolute path
- **Benefits**: Portable across environments, easy to move data

### Directory Structure
```
data/
├── uploads/           # Original uploaded videos
├── processed/         # Normalized videos and audio
│   └── {video_id}/
├── frames/           # Extracted frame images
│   └── {video_id}/
├── subs/             # SRT subtitle files
├── ask-uploads/      # User-uploaded images for chat
└── worker/           # Worker logs
    └── log.log
```

## Development

### Project Structure
```
video-qa/
├── src/app/api/          # API routes
│   ├── upload/           # Upload endpoint
│   ├── ask/              # Chat interface
│   ├── videos/           # Video management
│   └── frames/           # Frame image serving
├── src/app/(app)/        # Protected pages
│   ├── upload/           # Upload UI
│   └── ask/              # Chat interface
├── src/app/(auth)/       # Authentication
│   └── login/            # Login page
├── src/components/       # React components
│   ├── DashboardLayout   # Main layout
│   ├── ChatMessage      # Message rendering
│   └── ThemeProvider    # MUI theming
├── lib/                  # Shared utilities
│   ├── db.ts            # Database functions
│   ├── rag.ts           # RAG system
│   ├── vision.ts        # Vision analysis
│   └── file.ts          # File operations
└── postgres/            # Database schema
    └── initdb/
```

### Key Features
- **Authentication**: Demo login system with cookie-based sessions
- **Multimodal Search**: RAG system with vector embeddings and image analysis
- **Real-time Chat**: Streaming AI responses with frame and timestamp references
- **Material-UI**: Modern, responsive interface with custom theming
- **Idempotent Operations**: Safe to re-run processing
- **Error Handling**: Comprehensive error logging and user feedback

## Troubleshooting

### Common Issues

1. **Worker can't find video files**
   - Check `DATA_DIR` is correctly mounted in docker-compose
   - Verify file exists at resolved path

2. **Database connection errors**
   - Ensure PostgreSQL is running: `docker-compose ps`
   - Check connection string in `.env.local`

3. **OpenAI API errors**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key has sufficient credits

4. **Path resolution issues**
   - Ensure uploads use relative paths (`uploads/...`)
   - Check `DATA_DIR` environment variable

### Logs
- **Worker logs**: `data/worker/log.log`
- **Database logs**: `docker-compose logs postgres`
- **Next.js logs**: Terminal output

### Reset Database
```bash
docker-compose down
rm -rf data/postgres
docker-compose up -d
```

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system design
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [../video-qa-worker/README.md](../video-qa-worker/README.md) - Worker documentation