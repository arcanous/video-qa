# Quick Start Guide

Get the Video QA Platform running in 5 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] OpenAI API key (get from https://platform.openai.com/api-keys)
- [ ] Git installed

## Step-by-Step Setup

### 1. Clone Repositories
```bash
# Clone both repositories side by side
git clone <video-qa-repo-url> video-qa
git clone <video-worker-repo-url> video-worker
cd video-qa
```

### 2. Create Environment File
```bash
# Create environment file
cat > .env.local << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/videoqa
OPENAI_API_KEY=your_openai_api_key_here
EOF
```

### 3. Build Worker Image
```bash
# Build the worker Docker image
cd ../video-worker
docker build -t videoqa-worker:0.0.17 .
cd ../video-qa
```

### 4. Start Services
```bash
# Start database and worker
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose ps
```

### 5. Install Dependencies and Start App
```bash
# Install Next.js dependencies
pnpm install

# Start the development server
pnpm dev
```

### 6. Verify Setup
1. Open http://localhost:3000
2. You should see the upload interface
3. Check worker health: http://localhost:8000/healthz (if WORKER_DEV_HTTP=true)

## First Upload Walkthrough

### 1. Upload a Video
1. Click "Upload Video" button
2. Select a video file (MP4, MOV, AVI, etc.)
3. Wait for upload to complete
4. Note the video ID shown

### 2. Monitor Processing
1. Check the status endpoint: `GET /api/videos/{id}/status`
2. Watch the logs: `tail -f data/worker/log.log`
3. Processing typically takes 2-5 minutes for a 5-minute video

### 3. View Results
1. Check summary: `GET /api/videos/{id}/summary`
2. Results include:
   - Number of scenes detected
   - Number of frames extracted
   - Transcript segments
   - Total transcript characters

## Verification Steps

### Check Database
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d videoqa

# List videos
SELECT id, original_name, status, created_at FROM videos ORDER BY created_at DESC;

# List jobs
SELECT id, video_id, status, attempts FROM jobs ORDER BY created_at DESC;

# Exit
\q
```

### Check Worker Health
```bash
# Check worker logs
docker-compose logs worker

# Check health endpoint (if enabled)
curl http://localhost:8000/healthz
```

### Check File Storage
```bash
# List uploaded files
ls -la data/uploads/

# List processed files
ls -la data/processed/

# List extracted frames
ls -la data/frames/
```

## Common First-Run Issues

### Issue: "Worker can't find video files"
**Solution**: Check that `DATA_DIR` is correctly mounted
```bash
# Verify mount in docker-compose.yml
volumes:
  - ./data:/app/data
```

### Issue: "Database connection failed"
**Solution**: Ensure PostgreSQL is running
```bash
# Check service status
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

### Issue: "OpenAI API key invalid"
**Solution**: Verify API key is correct and has credits
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Issue: "Port 3000 already in use"
**Solution**: Kill existing process or use different port
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

## Next Steps

- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details
- [ ] Explore [../video-worker/README.md](../video-worker/README.md) for worker documentation
- [ ] Check [../video-worker/TROUBLESHOOTING.md](../video-worker/TROUBLESHOOTING.md) for common issues
- [ ] Try uploading different video types and sizes
- [ ] Monitor processing logs to understand the pipeline

## Getting Help

If you encounter issues:

1. **Check logs first**: `docker-compose logs worker`
2. **Verify environment**: Ensure all required variables are set
3. **Check file permissions**: Ensure data directory is writable
4. **Review troubleshooting guides**: See TROUBLESHOOTING.md files
5. **Check GitHub issues**: Look for similar problems and solutions
