'use client';

import { useState, useRef, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  Fade,
  Slide,
  Grow,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { 
  CloudUpload, 
  CheckCircle, 
  Error, 
  Close,
  VideoFile,
  Upload,
} from '@mui/icons-material';

export const dynamic = 'force-dynamic';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mount animation
  useState(() => {
    setMounted(true);
  });

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragOver) {
      setIsDragOver(false);
    }
  }, [isDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        setError(null);
        setSuccess(null);
      } else {
        setError('Please select a video file');
      }
    }
  }, []);

  // Poll processing status
  const pollStatus = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/status`);
      if (response.ok) {
        const status = await response.json();
        setProcessingStatus(status.status);
        
        if (status.status === 'ready' || status.status === 'failed') {
          setProcessingVideoId(null);
          if (status.status === 'ready') {
            setSuccess(`Video processing complete! Ready for questions.`);
          } else {
            setError('Video processing failed');
          }
        } else {
          // Continue polling
          setTimeout(() => pollStatus(videoId), 3000);
        }
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setProcessingVideoId(null);
      setError('Failed to check processing status');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Video uploaded successfully! ID: ${result.id}`);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Start polling for processing status
        setProcessingVideoId(result.id);
        setProcessingStatus('uploaded');
        pollStatus(result.id);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout currentPage="upload">
      <Fade in={mounted} timeout={600}>
        <Box sx={{ mt: 2 }}>
          <Slide direction="down" in={mounted} timeout={400}>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'text.primary',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Upload Videos
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Upload your video files to start asking questions about them
              </Typography>
            </Box>
          </Slide>
          
          <Slide direction="up" in={mounted} timeout={600}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 4, 
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <form onSubmit={handleSubmit}>
                <Box 
                  sx={{ 
                    mb: 3,
                    position: 'relative',
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Card
                    sx={{
                      border: isDragOver ? '2px dashed #6366f1' : '2px dashed #e5e7eb',
                      backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box sx={{ mb: 2 }}>
                        <CloudUpload 
                          sx={{ 
                            fontSize: 48, 
                            color: isDragOver ? 'primary.main' : 'text.secondary',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
                          }} 
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {isDragOver ? 'Drop your video here' : 'Choose Video File'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Drag and drop a video file here, or click to browse
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<Upload />}
                        disabled={uploading}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          hidden
                        />
                        Browse Files
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {file && (
                    <Fade in timeout={300}>
                      <Card 
                        sx={{ 
                          mt: 2, 
                          p: 2, 
                          backgroundColor: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <VideoFile color="primary" />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              },
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      </Card>
                    </Fade>
                  )}
                </Box>

                {uploading && (
                  <Fade in timeout={300}>
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        sx={{ 
                          mb: 1,
                          borderRadius: 1,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          },
                        }} 
                      />
                      <Typography variant="body2" color="text.secondary" align="center">
                        Uploading your video...
                      </Typography>
                    </Box>
                  </Fade>
                )}

                {error && (
                  <Fade in timeout={300}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        animation: 'shake 0.5s ease-in-out',
                      }}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => setError(null)}
                          sx={{ color: 'inherit' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      }
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {success && (
                  <Fade in timeout={300}>
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                      }}
                      icon={<CheckCircle />}
                      action={
                        <IconButton
                          size="small"
                          onClick={() => setSuccess(null)}
                          sx={{ color: 'inherit' }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      }
                    >
                      {success}
                    </Alert>
                  </Fade>
                )}

                {processingVideoId && (
                  <Fade in timeout={300}>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`Processing... (${processingStatus})`}
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          mr: 1,
                          animation: 'pulse 2s ease-in-out infinite',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Video ID: {processingVideoId}
                      </Typography>
                    </Box>
                  </Fade>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!file || uploading}
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      transform: 'none',
                      boxShadow: '0 4px 15px rgba(156, 163, 175, 0.4)',
                    },
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </form>
            </Paper>
          </Slide>
        </Box>
      </Fade>
    </DashboardLayout>
  );
}
