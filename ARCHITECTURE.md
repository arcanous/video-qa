# System Architecture

Deep dive into the Video QA Platform system design, component interactions, and technical decisions.

## System Overview

The Video QA Platform is a distributed system consisting of three main components:

1. **Next.js Frontend** (`video-qa`) - User interface and API layer
2. **Python Worker** (`video-worker`) - Video processing pipeline
3. **PostgreSQL Database** - Shared data store with vector embeddings

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Upload    │  │   Status    │  │    Query    │            │
│  │   Page      │  │   Page      │  │   Page      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application Layer                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Upload   │  │   Status    │  │   Summary   │            │
│  │   API      │  │   API       │  │   API       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │   File     │  │   Database  │                             │
│  │   Utils    │  │   Utils     │                             │
│  └─────────────┘  └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ PostgreSQL │  │ File System │  │   Logs     │            │
│  │ + pgvector │  │   Storage   │  │   Storage   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Worker Processing Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Job       │  │  Pipeline   │  │   Health    │            │
│  │  Polling    │  │  Stages     │  │  Monitor    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Upload Flow
```
User Upload → Next.js API → File Storage → Database → Job Queue
     │              │            │           │          │
     │              │            │           │          │
     ▼              ▼            ▼           ▼          ▼
[Browser] → [POST /api/upload] → [data/uploads/] → [videos table] → [jobs table]
```

### Processing Flow
```
Job Queue → Worker Claim → Pipeline → Database Updates → Status Change
    │           │            │            │              │
    │           │            │            │              │
    ▼           ▼            ▼            ▼              ▼
[jobs table] → [FOR UPDATE SKIP LOCKED] → [6-stage pipeline] → [All tables] → [videos.status = 'ready']
```

## Database Schema Design

### Core Tables and Relationships

```
videos (1) ──→ (many) jobs
    │
    ├─→ (many) scenes
    │       │
    │       └─→ (many) frames
    │               │
    │               └─→ (1) frame_captions
    │
    └─→ (many) transcript_segments
```

### Table Purposes

| Table | Purpose | Key Fields | Indexes |
|-------|---------|------------|---------|
| `videos` | Video metadata | `id`, `original_path`, `status` | Primary key |
| `jobs` | Processing queue | `id`, `video_id`, `status` | `(video_id, status)` |
| `scenes` | Scene boundaries | `id`, `video_id`, `t_start`, `t_end` | `(video_id, idx)` |
| `frames` | Extracted frames | `id`, `scene_id`, `phash` | `(scene_id)` |
| `transcript_segments` | Audio transcription | `id`, `video_id`, `text`, `embedding` | HNSW vector |
| `frame_captions` | Vision analysis | `id`, `frame_id`, `caption`, `embedding` | HNSW vector |

### ID Generation Patterns

The system uses consistent ID patterns for easy debugging and relationship tracking:

```typescript
// Video ID: nanoid() - e.g., "abc123def456"
// Job ID: nanoid() - e.g., "xyz789uvw012"
// Scene ID: "{video_id}_scene_{idx:03d}" - e.g., "abc123def456_scene_001"
// Frame ID: "{video_id}_frame_{idx:03d}" - e.g., "abc123def456_frame_001"
// Segment ID: "{video_id}_segment_{idx:03d}" - e.g., "abc123def456_segment_001"
// Caption ID: "{frame_id}_caption" - e.g., "abc123def456_frame_001_caption"
```

## File Storage Strategy

### Path Resolution System

The system uses a two-tier path resolution strategy:

1. **Database Storage**: Relative paths only (`uploads/{id}_{name}.mp4`)
2. **Worker Resolution**: Absolute paths via `DATA_DIR` environment variable

### Directory Structure

```
data/
├── uploads/                    # Original uploaded videos
│   └── {id}_{name}.mp4        # Original files
├── processed/                  # Normalized videos
│   └── {video_id}/
│       ├── normalized.mp4      # 720p/30fps video
│       └── audio.wav          # 16kHz mono audio
├── frames/                     # Extracted frame images
│   └── {video_id}/
│       └── scene_*.jpg        # Representative frames
├── subs/                      # SRT subtitle files
│   └── {video_id}.srt        # Generated subtitles
└── worker/                    # Worker logs
    └── log.log               # Processing logs
```

### Benefits of Relative Paths

- **Portability**: Easy to move data between environments
- **Docker Compatibility**: Works with volume mounts
- **Backup Friendly**: Relative paths in database
- **Environment Agnostic**: Same code works locally and in production

## API Design

### RESTful Endpoints

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/upload` | Upload video | `FormData` | `{ id: string }` |
| GET | `/api/videos/[id]/status` | Get status | - | `{ status, attempts, updatedAt }` |
| GET | `/api/videos/[id]/summary` | Get results | - | `{ scenes, frames, transcriptSegments, transcriptChars }` |

### Error Handling

All API endpoints follow consistent error handling:

```typescript
// Success response
{ data: T }

// Error response
{ error: string, status: number }
```

### Request/Response Examples

#### Upload Request
```typescript
// POST /api/upload
const formData = new FormData();
formData.append('file', videoFile);

// Response
{ id: "abc123def456" }
```

#### Status Response
```typescript
// GET /api/videos/abc123def456/status
{
  status: "processing",
  attempts: 1,
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

## Worker Architecture

### Job Processing Model

The worker uses a **pull-based job processing model**:

1. **Polling**: Worker polls database every 1.5 seconds
2. **Atomic Claiming**: Uses `FOR UPDATE SKIP LOCKED` for safe job claiming
3. **Status Tracking**: Updates job and video status throughout processing
4. **Error Handling**: Comprehensive error logging and retry logic

### Pipeline Stages

The worker processes videos through 6 sequential stages:

```
[1. NORMALIZE] → [2. TRANSCRIBE] → [3. SCENES] → [4. FRAMES] → [5. VISION] → [6. EMBEDDINGS]
```

Each stage:
- **Reads**: Previous stage outputs
- **Writes**: Database records and files
- **Updates**: Video status and metadata
- **Logs**: Progress and errors

### Database Coupling

The worker is **tightly coupled** to the database schema:

- **Reads**: `videos.original_path`, job queue
- **Writes**: All processing tables (scenes, frames, transcripts, captions)
- **Updates**: Video status, normalized path, duration
- **Dependencies**: Specific column names, ID patterns, table relationships

## Security Considerations

### File Upload Security

- **File Type Validation**: Only video files allowed
- **Size Limits**: 500MB maximum file size
- **Path Sanitization**: Safe filename generation
- **Content Validation**: FFmpeg validation before processing

### Database Security

- **Connection Pooling**: Limited concurrent connections
- **SQL Injection**: Parameterized queries only
- **Access Control**: Database user with minimal privileges

### API Security

- **Input Validation**: Zod schema validation
- **Error Handling**: No sensitive information in error responses
- **Rate Limiting**: Built into Next.js (future enhancement)

## Performance Characteristics

### Processing Times

| Video Length | Processing Time | Stages |
|--------------|-----------------|--------|
| 1 minute | 30-60 seconds | All stages |
| 5 minutes | 2-5 minutes | All stages |
| 30 minutes | 10-20 minutes | All stages |

### Resource Usage

- **CPU**: High during processing (FFmpeg, AI APIs)
- **Memory**: Moderate (image processing, embeddings)
- **Storage**: 2-3x original video size (normalized + frames)
- **Network**: OpenAI API calls for transcription and vision

### Scalability Considerations

- **Horizontal**: Multiple worker instances
- **Vertical**: More CPU/memory for faster processing
- **Database**: Connection pooling, read replicas
- **Storage**: Distributed file systems

## Monitoring and Observability

### Health Checks

- **Database**: Connection pool status
- **Worker**: Job processing status
- **Storage**: Disk space and file access
- **APIs**: Response times and error rates

### Logging Strategy

- **Structured Logging**: JSON format for parsing
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Rotation**: 5MB files, 3 backups
- **Context**: Video ID, job ID, stage information

### Metrics to Track

- **Processing Time**: Per stage and total
- **Success Rate**: Jobs completed vs failed
- **Queue Depth**: Pending jobs count
- **Resource Usage**: CPU, memory, disk
- **API Performance**: Response times

## Future Enhancements

### Planned Features

- **Query Interface**: AI-powered video search
- **Batch Processing**: Multiple video uploads
- **Progress Tracking**: Real-time processing updates
- **Export Options**: Download processed data

### Technical Improvements

- **Caching**: Redis for frequently accessed data
- **CDN**: CloudFront for file delivery
- **Queue System**: SQS for job management
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: Automated testing and deployment

## See Also

- [README.md](./README.md) - Main project documentation
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [../video-worker/README.md](../video-worker/README.md) - Worker documentation
- [../video-worker/PIPELINE.md](../video-worker/PIPELINE.md) - Pipeline details
- [../video-worker/DATA_MODEL.md](../video-worker/DATA_MODEL.md) - Database schema
