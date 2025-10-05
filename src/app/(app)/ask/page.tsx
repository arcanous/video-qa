'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import ChatMessage from '../../../components/ChatMessage';
import {
  Box, Card, TextField, Button,
  Select, MenuItem, FormControl, InputLabel,
  IconButton, CircularProgress, Typography, Paper,
  Checkbox, ListItemText, Chip, Fade, Slide, Grow,
  Zoom, Skeleton, Avatar
} from '@mui/material';
import { Send, Stop, Image as ImageIcon, Close, SmartToy, Person } from '@mui/icons-material';


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
  const [mounted, setMounted] = useState(false);
  
  const [input, setInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);
  
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
      <Fade in={mounted} timeout={600}>
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Video Selector */}
          <Slide direction="down" in={mounted} timeout={400}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                    },
                  },
                }}
              >
                {loadingVideos ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      Loading videos...
                    </Box>
                  </MenuItem>
                ) : videos.length === 0 ? (
                  <MenuItem disabled>No videos available</MenuItem>
                ) : (
                  videos.map((v, index) => (
                    <Fade in timeout={300 + index * 100} key={v.id}>
                      <MenuItem 
                        value={v.id}
                        sx={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Checkbox checked={selectedVideoIds.indexOf(v.id) > -1} />
                        <ListItemText primary={v.original_name || v.id} />
                      </MenuItem>
                    </Fade>
                  ))
                )}
              </Select>
            </FormControl>
          </Slide>
        
          {/* Error Display */}
          {error && (
            <Fade in timeout={300}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'error.light', 
                borderRadius: 2,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                animation: 'shake 0.5s ease-in-out',
              }}>
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              </Box>
            </Fade>
          )}
          
          {/* Messages Area */}
          <Slide direction="up" in={mounted} timeout={600}>
            <Paper 
              sx={{ 
                flex: 1, 
                p: 2, 
                overflow: 'auto',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
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
              <Fade in timeout={300 + i * 100} key={i}>
                <Box sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 1,
                }}>
                  {m.role === 'assistant' && (
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main',
                        width: 32,
                        height: 32,
                        mt: 0.5,
                      }}
                    >
                      <SmartToy />
                    </Avatar>
                  )}
                  <Card 
                    sx={{ 
                      maxWidth: '70%', 
                      p: 2,
                      borderRadius: 3,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    {m.imagePreviewUrl && (
                      <Zoom in timeout={300}>
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
                      </Zoom>
                    )}
                    <ChatMessage content={m.content} role={m.role as 'user' | 'assistant'} />
                  </Card>
                  {m.role === 'user' && (
                    <Avatar 
                      sx={{ 
                        bgcolor: 'secondary.main',
                        width: 32,
                        height: 32,
                        mt: 0.5,
                      }}
                    >
                      <Person />
                    </Avatar>
                  )}
                </Box>
              </Fade>
            ))
          )}
          {isLoading && (
            <Fade in timeout={300}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 2,
                gap: 1,
              }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Box>
            </Fade>
          )}
          <div ref={messagesEndRef} />
        </Paper>
      </Slide>
        
        {/* Context Panel - removed for now as data property is not available in this version */}
        
          {/* Input Area */}
          <Slide direction="up" in={mounted} timeout={800}>
            <Box 
              component="form" 
              onSubmit={onSubmit} 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'flex-end',
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: 3,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              {pendingImage && (
                <Fade in timeout={300}>
                  <Box sx={{ position: 'relative' }}>
                    <img 
                      src={pendingImage.previewUrl} 
                      alt="Preview" 
                      style={{ 
                        width: 60, 
                        height: 60, 
                        objectFit: 'cover', 
                        borderRadius: 8,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} 
                    />
                    <IconButton
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: -8, 
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
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
                </Fade>
              )}
              
              <IconButton 
                component="label" 
                disabled={isLoading}
                sx={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                    },
                  },
                }}
              />
              
              {isLoading ? (
                <Button 
                  variant="outlined" 
                  startIcon={<Stop />} 
                  disabled
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Stop
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<Send />} 
                  disabled={selectedVideoIds.length === 0 || !input.trim()}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
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
                  Send
                </Button>
              )}
            </Box>
          </Slide>
        </Box>
      </Fade>
    </DashboardLayout>
  );
}
