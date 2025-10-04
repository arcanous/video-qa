'use client';

import { useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Chip,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export const dynamic = 'force-dynamic';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

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
      <Box sx={{ mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Upload Videos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Upload your video files to start asking questions about them
        </Typography>
        
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{ 
                  mb: 2,
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  hidden
                />
                Choose Video File
              </Button>
              {file && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 1 }}>
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            {uploading && <LinearProgress sx={{ mb: 2 }} />}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {processingVideoId && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`Processing... (${processingStatus})`}
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Video ID: {processingVideoId}
                </Typography>
              </Box>
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
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}
