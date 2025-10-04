'use client';

import { useActionState } from 'react';

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
} from '@mui/material';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { success: false, error: '' });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              Video QA
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Ask questions about your videos with AI
            </Typography>
          </Box>
          
          <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                Demo credentials: <strong>demo</strong> / <strong>demo123</strong>
              </Typography>
              
              {state?.error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {state.error}
                </Alert>
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
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  {isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
