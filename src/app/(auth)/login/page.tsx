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

// Floating particles component with darker theme
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
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 40, sm: 60 },
            height: { xs: 40, sm: 60 },
            borderRadius: '50%',
            background: `rgba(99, 102, 241, ${0.05 + i * 0.02})`,
            animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            left: `${5 + i * 12}%`,
            top: `${10 + i * 8}%`,
            filter: 'blur(1px)',
          }}
        />
      ))}
      {[...Array(4)].map((_, i) => (
        <Box
          key={`glow-${i}`}
          sx={{
            position: 'absolute',
            width: { xs: 120, sm: 160 },
            height: { xs: 120, sm: 160 },
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(99, 102, 241, ${0.03 + i * 0.01}) 0%, transparent 70%)`,
            animation: `pulse-slow ${6 + i}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
            left: `${20 + i * 20}%`,
            top: `${15 + i * 20}%`,
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
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #1a1a2e 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient-xy 20s ease infinite',
        position: 'relative',
        p: 2,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)',
          animation: 'pulse-slow 8s ease-in-out infinite',
        },
      }}
    >
      <FloatingParticles />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Fade in={mounted} timeout={1000}>
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                  animation: 'fade-in-up 0.8s ease-out',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                Video QA
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  animation: 'fade-in-up 1s ease-out 0.3s both',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                }}
              >
                Ask questions about your videos with AI
              </Typography>
            </Box>
          </Fade>
          
          <Slide direction="up" in={mounted} timeout={800}>
            <Card 
              sx={{ 
                width: '100%', 
                maxWidth: 420, 
                borderRadius: 3, 
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                background: 'rgba(15, 15, 35, 0.8)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%, rgba(236, 72, 153, 0.05) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.3)',
                  '&::before': {
                    opacity: 1,
                  },
                },
              }}
            >
              <CardContent sx={{ p: 5, position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="h4" 
                  component="h2" 
                  gutterBottom 
                  align="center" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    align: 'center', 
                    mb: 4,
                    fontWeight: 400,
                  }}
                >
                  Demo credentials: <strong style={{ color: 'rgba(99, 102, 241, 0.9)' }}>demo</strong> / <strong style={{ color: 'rgba(99, 102, 241, 0.9)' }}>demo123</strong>
                </Typography>
                
                {state?.error && (
                  <Fade in={!!state?.error} timeout={400}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 2,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'rgba(239, 68, 68, 0.9)',
                        animation: 'shake 0.6s ease-in-out',
                        backdropFilter: 'blur(10px)',
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
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderColor: 'rgba(99, 102, 241, 0.5)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(99, 102, 241, 0.8)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
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
                      mb: 4,
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderColor: 'rgba(99, 102, 241, 0.5)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(99, 102, 241, 0.8)',
                          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
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
                      py: 1.8,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        transition: 'left 0.5s ease',
                      },
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5b5bd6 0%, #7c3aed 50%, #9333ea 100%)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                        '&::before': {
                          left: '100%',
                        },
                      },
                      '&:active': {
                        transform: 'translateY(-1px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                        transform: 'none',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      },
                    }}
                  >
                    {isPending ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={18} color="inherit" />
                        <Typography sx={{ fontWeight: 500 }}>Signing in...</Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>Sign In</Typography>
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
