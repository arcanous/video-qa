'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Card, Typography, Chip, Skeleton } from '@mui/material';
import { AccessTime, Image as ImageIcon } from '@mui/icons-material';
import Image from 'next/image';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

// Custom component for frame images
const FrameImage = ({ frameId }: { frameId: string }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  // Extract video_id and frame number from frame_id pattern
  // frame_id format: {video_id}_frame_{frame_num:03d}
  const match = frameId.match(/^(.+)_frame_(\d+)$/);
  if (!match) return null;
  
  const [, videoId, frameNum] = match;
  const imagePath = `/api/frames/${videoId}/${frameNum}`;
  
  if (imageError) {
    return (
      <Card sx={{ p: 2, mt: 1, bgcolor: 'grey.100' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon color="disabled" />
          <Typography variant="body2" color="text.secondary">
            Frame image not available
          </Typography>
        </Box>
      </Card>
    );
  }
  
  return (
    <Card sx={{ p: 2, mt: 1, maxWidth: 400 }}>
      {imageLoading && (
        <Skeleton variant="rectangular" width="100%" height={200} />
      )}
      <Image
        src={imagePath}
        alt={`Frame ${frameNum} from video ${videoId}`}
        width={400}
        height={200}
        style={{
          width: '100%',
          height: 'auto',
          display: imageLoading ? 'none' : 'block'
        }}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Frame {frameNum} • {videoId}
      </Typography>
    </Card>
  );
};

// Custom component for timestamps
const TimestampChip = ({ timestamp }: { timestamp: string }) => (
  <Chip
    icon={<AccessTime />}
    label={timestamp}
    size="small"
    color="primary"
    variant="outlined"
    sx={{ ml: 1 }}
  />
);

// Custom renderers for ReactMarkdown
const customComponents = {
  // Handle paragraphs with proper spacing
  p: ({ children, ...props }: any) => (
    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }} {...props}>
      {children}
    </Typography>
  ),
  
  // Handle strong text (bold) - check for timestamp patterns
  strong: ({ children, ...props }: any) => {
    const text = children?.toString() || '';
    
    // Check for timestamp patterns like [T: 1:23-1:45] or (1:23-1:45)
    const timestampMatch = text.match(/\[T:\s*(\d+:\d+-\d+:\d+)\]|\((\d+:\d+-\d+:\d+)\)/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1] || timestampMatch[2];
      return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <strong {...props}>{text}</strong>
          <TimestampChip timestamp={timestamp} />
        </Box>
      );
    }
    
    return <strong {...props}>{children}</strong>;
  },
  
  // Handle text content - look for frame references
  text: ({ children, ...props }: any) => {
    const text = children?.toString() || '';
    
    // Check for frame references like [F: video_id_frame_003]
    const frameMatch = text.match(/\[F:\s*([a-zA-Z0-9_]+_frame_\d+)\]/);
    if (frameMatch) {
      const frameId = frameMatch[1];
      return (
        <Box>
          <span {...props}>{text.replace(frameMatch[0], '')}</span>
          <FrameImage frameId={frameId} />
        </Box>
      );
    }
    
    return <span {...props}>{children}</span>;
  },
  
  // Handle lists
  ul: ({ children, ...props }: any) => (
    <Box component="ul" sx={{ pl: 3, mb: 2 }} {...props}>
      {children}
    </Box>
  ),
  
  ol: ({ children, ...props }: any) => (
    <Box component="ol" sx={{ pl: 3, mb: 2 }} {...props}>
      {children}
    </Box>
  ),
  
  li: ({ children, ...props }: any) => (
    <Typography component="li" variant="body1" sx={{ mb: 0.5 }} {...props}>
      {children}
    </Typography>
  ),
  
  // Handle code blocks
  code: ({ children, ...props }: any) => (
    <Box
      component="code"
      sx={{
        bgcolor: 'grey.100',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.875rem'
      }}
      {...props}
    >
      {children}
    </Box>
  ),
  
  pre: ({ children, ...props }: any) => (
    <Box
      component="pre"
      sx={{
        bgcolor: 'grey.100',
        p: 2,
        borderRadius: 1,
        overflow: 'auto',
        mb: 2
      }}
      {...props}
    >
      {children}
    </Box>
  )
};

export default function ChatMessage({ content, role }: ChatMessageProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <ReactMarkdown components={customComponents}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
