import { getAllVideoIds } from '../../../../lib/db';
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
  Container,
  Grid,
  Paper,
} from '@mui/material';
import { Send } from '@mui/icons-material';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function AskPage() {
  const videoIds = getAllVideoIds();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Chat
        </Typography>
        
        <Grid container spacing={3}>
          {/* Left column - Video list */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uploaded Videos ({videoIds.length})
                </Typography>
                {videoIds.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No videos uploaded yet. Go to the upload page to add videos.
                  </Typography>
                ) : (
                  <List dense>
                    {videoIds.map((id) => (
                      <ListItem key={id} divider>
                        <ListItemText
                          primary={id}
                          secondary="Video ID"
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
            <Paper sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
              {/* Chat messages area */}
              <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Chat interface will be implemented here
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  AI features coming soon...
                </Typography>
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
                  />
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    disabled
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
