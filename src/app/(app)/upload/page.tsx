'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Container,
  LinearProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upload Video
        </Typography>
        
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <input
                  id="file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={uploading}
                  sx={{ mb: 2 }}
                >
                  Choose Video File
                </Button>
                {file && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
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

              <Button
                type="submit"
                variant="contained"
                disabled={!file || uploading}
                fullWidth
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
