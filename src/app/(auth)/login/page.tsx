'use client';

import { useActionState } from 'react';
import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Fade,
  Slide,
  CircularProgress,
} from '@mui/material';
import { loginAction } from './actions';

// Floating particles component
const FloatingParticles = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 60, sm: 80 },
            height: { xs: 60, sm: 80 },
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            animation: `float ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            left: `${10 + i * 15}%`,
            top: `${20 + i * 10}%`,
          }}
        />
      ))}
    </Box>
  );
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { success: false, error: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
        backgroundSize: '400% 400%',
        animation: 'gradient-xy 15s ease infinite',
        position: 'relative',
        p: 2,
        overflow: 'hidden',
      }}
    >
      <FloatingParticles />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Fade in={mounted} timeout={800}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  animation: 'fade-in-up 0.6s ease-out',
                }}
              >
                Video QA
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  animation: 'fade-in-up 0.8s ease-out 0.2s both',
                }}
              >
                Ask questions about your videos with AI
              </Typography>
            </Box>
          </Fade>
          
          <Slide direction="up" in={mounted} timeout={600}>
            <Card 
              sx={{ 
                width: '100%', 
                maxWidth: 400, 
                borderRadius: 4, 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography 
                  variant="h4" 
                  component="h2" 
                  gutterBottom 
                  align="center" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  align="center" 
                  sx={{ mb: 4 }}
                >
                  Demo credentials: <strong>demo</strong> / <strong>demo123</strong>
                </Typography>
                
                {state?.error && (
                  <Fade in={!!state?.error} timeout={300}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 2,
                        animation: 'shake 0.5s ease-in-out',
                      }}
                    >
                      {state.error}
                    </Alert>
                  </Fade>
                )}
                
                <Box component="form" action={formAction} sx={{ mt: 1 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    name="username"
                    label="Username"
                    defaultValue="demo"
                    autoComplete="username"
                    autoFocus
                    sx={{ 
                      mb: 2, 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
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
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    defaultValue="demo123"
                    autoComplete="current-password"
                    sx={{ 
                      mb: 3, 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
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
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isPending}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                        transform: 'none',
                        boxShadow: '0 4px 15px rgba(156, 163, 175, 0.4)',
                      },
                    }}
                  >
                    {isPending ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Signing in...
                      </Box>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Box>
      </Container>
    </Box>
  );
}
