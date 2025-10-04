import { getAllVideoIds } from '../../../../lib/db';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Grid,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import { Send, VideoFile, Chat } from '@mui/icons-material';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AskPage() {
  const videoIds = await getAllVideoIds();

  return (
    <DashboardLayout currentPage="ask">
      <Box sx={{ mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Ask Questions
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Ask questions about your uploaded videos using AI
        </Typography>
        
        <Grid container spacing={3}>
          {/* Left column - Video list */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VideoFile sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Your Videos
                  </Typography>
                  <Chip 
                    label={videoIds.length} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                {videoIds.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <VideoFile sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No videos uploaded yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Go to the upload page to add videos
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {videoIds.map((id, index) => (
                      <ListItem key={id} sx={{ px: 0 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                        <ListItemText
                          primary={id}
                          secondary="Video ID"
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right column - Chat placeholder */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ height: 600, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
              {/* Chat header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Chat sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  AI Chat
                </Typography>
              </Box>
              
              {/* Chat messages area */}
              <Box sx={{ flex: 1, p: 4, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chat sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Chat interface coming soon
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI features will be implemented here
                  </Typography>
                </Box>
              </Box>
              
              {/* Chat input area */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box component="form" sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Ask a question about your videos..."
                    variant="outlined"
                    size="small"
                    disabled
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    disabled
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
