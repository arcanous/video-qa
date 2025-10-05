'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import ChatMessage from '../../../components/ChatMessage';
import {
  Box, Card, TextField, Button,
  Select, MenuItem, FormControl, InputLabel,
  IconButton, CircularProgress, Typography, Paper,
  Checkbox, ListItemText, Chip
} from '@mui/material';
import { Send, Stop, Image as ImageIcon, Close } from '@mui/icons-material';


interface Message {
  id: string;
  role: string;
  content: string;
  imageId?: string;
  imagePreviewUrl?: string;
}

export default function AskPage() {
  const [videos, setVideos] = useState<Array<{id: string, original_name: string, status: string}>>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [pendingImage, setPendingImage] = useState<{
    id: string;
    previewUrl: string;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [loadingVideos, setLoadingVideos] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [input, setInput] = useState('');
  
  // Load videos
  useEffect(() => {
    fetch('/api/videos')
      .then(r => r.json())
      .then(videoData => {
        setVideos(videoData);
        // Set all videos as selected by default
        setSelectedVideoIds(videoData.map((v: any) => v.id));
      })
      .catch(err => {
        console.error('Failed to load videos:', err);
        setError('Failed to load videos');
      })
      .finally(() => setLoadingVideos(false));
  }, []);
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    // Upload immediately
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/ask/upload-image', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      const { imageId } = await res.json();
      setPendingImage({ id: imageId, previewUrl });
      setError('');
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload image');
      URL.revokeObjectURL(previewUrl);
    }
  };
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVideoIds.length === 0 || !input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageId: pendingImage?.id,
      imagePreviewUrl: pendingImage?.previewUrl
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');
    const currentImageId = pendingImage?.id;
    setPendingImage(null); // Clear pending image
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          videoIds: selectedVideoIds,
          imageId: currentImageId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ''
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      const decoder = new TextDecoder();
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <DashboardLayout currentPage="ask">
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* Video Selector */}
        <FormControl fullWidth>
          <InputLabel>Select Videos</InputLabel>
          <Select
            multiple
            value={selectedVideoIds}
            onChange={(e) => setSelectedVideoIds(e.target.value as string[])}
            label="Select Videos"
            disabled={loadingVideos}
            renderValue={(selected) => {
              if (selected.length === 0) return 'No videos selected';
              if (selected.length === videos.length) return `All videos (${videos.length})`;
              return `${selected.length} videos selected`;
            }}
          >
            {loadingVideos ? (
              <MenuItem disabled>Loading videos...</MenuItem>
            ) : videos.length === 0 ? (
              <MenuItem disabled>No videos available</MenuItem>
            ) : (
              videos.map(v => (
                <MenuItem key={v.id} value={v.id}>
                  <Checkbox checked={selectedVideoIds.indexOf(v.id) > -1} />
                  <ListItemText primary={v.original_name || v.id} />
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        {/* Error Display */}
        {error && (
          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}
        
        {/* Messages Area */}
        <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              {videos.length === 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>No videos uploaded yet</Typography>
                  <Typography variant="body2">Go to the upload page to add videos first</Typography>
                </Box>
              ) : selectedVideoIds.length === 0 ? (
                <Typography>Select videos and ask a question</Typography>
              ) : (
                <Typography>Ask a question about the selected videos</Typography>
              )}
            </Box>
          ) : (
            messages.map((m, i) => (
              <Box key={i} sx={{ mb: 2, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Card sx={{ maxWidth: '70%', p: 2 }}>
                  {m.imagePreviewUrl && (
                    <Box sx={{ mb: 2 }}>
                      <img 
                        src={m.imagePreviewUrl} 
                        alt="User uploaded" 
                        style={{ 
                          maxWidth: '100%', 
                          borderRadius: 8,
                          display: 'block'
                        }}
                      />
                    </Box>
                  )}
                  <ChatMessage content={m.content} role={m.role as 'user' | 'assistant'} />
                </Card>
              </Box>
            ))
          )}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Paper>
        
        {/* Context Panel - removed for now as data property is not available in this version */}
        
        {/* Input Area */}
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          {pendingImage && (
            <Box sx={{ position: 'relative' }}>
              <img 
                src={pendingImage.previewUrl} 
                alt="Preview" 
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} 
              />
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                onClick={() => {
                  if (pendingImage.previewUrl) {
                    URL.revokeObjectURL(pendingImage.previewUrl);
                  }
                  setPendingImage(null);
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          )}
          
              <IconButton component="label" disabled={isLoading}>
            <ImageIcon />
            <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
          </IconButton>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the videos..."
            disabled={selectedVideoIds.length === 0 || isLoading}
          />
          
          {isLoading ? (
            <Button variant="outlined" startIcon={<Stop />} disabled>Stop</Button>
          ) : (
            <Button type="submit" variant="contained" startIcon={<Send />} disabled={selectedVideoIds.length === 0 || !input.trim()}>
              Send
            </Button>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}
