'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Card, Typography, Chip, Skeleton, Fade, Zoom, Grow } from '@mui/material';
import { AccessTime, Image as ImageIcon, VideoLibrary } from '@mui/icons-material';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

// Video section component for structured content
const VideoSection = ({ videoName, children }: { videoName: string; children: React.ReactNode }) => (
  <Card sx={{ 
    mb: 3, 
    p: 2,
    borderLeft: '4px solid',
    borderColor: 'primary.main',
    bgcolor: 'background.paper',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <VideoLibrary color="primary" />
      <Typography variant="h6" color="primary.main" fontWeight={600}>
        {videoName}
      </Typography>
    </Box>
    {children}
  </Card>
);

// Custom component for frame images
const FrameImage = ({ frameId }: { frameId: string }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  
  const match = frameId.match(/^(.+)_frame_(\d+)$/);
  if (!match) return null;
  
  const [, videoId, frameNum] = match;
  const imagePath = `/api/frames/${videoId}/${frameNum}`;
  
  if (imageError) return null; // Hide if image doesn't exist
  
  return (
    <Card sx={{ 
      mt: 1.5,
      mb: 1.5,
      maxWidth: 400,
      overflow: 'hidden',
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
      },
    }}>
      {imageLoading && (
        <Skeleton variant="rectangular" width="100%" height={200} />
      )}
      <img
        src={imagePath}
        alt={`Frame ${frameNum}`}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '400px',
        }}
        onLoad={() => {
          console.log('Frame image loaded:', imagePath);
          setImageLoading(false);
        }}
        onError={(e) => {
          console.error('Frame image error:', imagePath, e);
          setImageError(true);
          setImageLoading(false);
        }}
      />
      <Box sx={{ px: 1.5, py: 1, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          📸 Frame {frameNum}
        </Typography>
      </Box>
    </Card>
  );
};

// Custom component for timestamps
const TimestampChip = ({ timestamp, videoName }: { timestamp: string; videoName?: string }) => (
  <Chip
    icon={<AccessTime />}
    label={
      <Box component="span">
        <strong>{timestamp}</strong>
        {videoName && <Box component="span" sx={{ ml: 0.5, opacity: 0.8, fontSize: '0.85em' }}>
          • {videoName}
        </Box>}
      </Box>
    }
    size="medium"
    color="primary"
    sx={{ 
      ml: 1,
      fontWeight: 600,
      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
      },
    }}
  />
);

// Custom renderers for ReactMarkdown
const customComponents = {
  // H3 for video sections
  h3: ({ children, ...props }: any) => {
    const text = children?.toString() || '';
    const videoMatch = text.match(/Video:\s*"([^"]+)"/);
    
    if (videoMatch) {
      return (
        <VideoSection videoName={videoMatch[1]}>
          {/* Content will be rendered inside */}
        </VideoSection>
      );
    }
    
    return (
      <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }} {...props}>
        {children}
      </Typography>
    );
  },
  
  // H2 for main sections
  h2: ({ children, ...props }: any) => (
    <Typography variant="h5" sx={{ mt: 3, mb: 2, fontWeight: 700, color: 'primary.main' }} {...props}>
      {children}
    </Typography>
  ),
  
  // Paragraphs with enhanced processing
  p: ({ children, ...props }: any) => {
    // Convert children to string to process references
    const processContent = (content: any): any => {
      if (typeof content === 'string') {
        // Process frame references: [F: videoId_frame_003]
        const frameRegex = /\[F:\s*([a-zA-Z0-9_-]+_frame_\d+)\]/g;
        const timestampRegex = /\[T:\s*(\d+:\d+-\d+:\d+)\]/g;
        
        const elements: any[] = [];
        let lastIndex = 0;
        
        // Find all matches
        const allMatches: Array<{type: 'frame' | 'timestamp', match: RegExpExecArray, index: number}> = [];
        
        let match;
        while ((match = frameRegex.exec(content)) !== null) {
          allMatches.push({ type: 'frame', match, index: match.index });
        }
        frameRegex.lastIndex = 0; // Reset regex
        
        while ((match = timestampRegex.exec(content)) !== null) {
          allMatches.push({ type: 'timestamp', match, index: match.index });
        }
        
        // Sort by index
        allMatches.sort((a, b) => a.index - b.index);
        
        if (allMatches.length === 0) {
          return content;
        }
        
        // Build elements
        allMatches.forEach(({ type, match, index }) => {
          // Add text before match
          if (index > lastIndex) {
            elements.push(content.substring(lastIndex, index));
          }
          
          // Add the component
          if (type === 'frame') {
            elements.push(<FrameImage key={`frame-${index}`} frameId={match[1]} />);
          } else if (type === 'timestamp') {
            elements.push(<TimestampChip key={`timestamp-${index}`} timestamp={match[1]} />);
          }
          
          lastIndex = index + match[0].length;
        });
        
        // Add remaining text
        if (lastIndex < content.length) {
          elements.push(content.substring(lastIndex));
        }
        
        return elements.length > 0 ? elements : content;
      }
      
      if (Array.isArray(content)) {
        return content.map((item, index) => (
          <React.Fragment key={index}>{processContent(item)}</React.Fragment>
        ));
      }
      
      return content;
    };
    
    return (
      <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }} {...props}>
        {processContent(children)}
      </Typography>
    );
  },
  
  // Handle text with frame and timestamp references
  text: ({ children, ...props }: any) => {
    const text = children?.toString() || '';
    
    // Frame reference: [F: videoId_frame_003]
    const frameMatch = text.match(/\[F:\s*([a-zA-Z0-9_-]+_frame_\d+)\]/);
    if (frameMatch) {
      const frameId = frameMatch[1];
      const textBefore = text.substring(0, frameMatch.index);
      const textAfter = text.substring(frameMatch.index! + frameMatch[0].length);
      
      return (
        <Box component="span">
          {textBefore}
          <FrameImage frameId={frameId} />
          {textAfter}
        </Box>
      );
    }
    
    // Timestamp reference: [T: 1:23-1:45]
    const timestampMatch = text.match(/\[T:\s*(\d+:\d+-\d+:\d+)\]/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const textBefore = text.substring(0, timestampMatch.index);
      const textAfter = text.substring(timestampMatch.index! + timestampMatch[0].length);
      
      return (
        <Box component="span">
          {textBefore}
          <TimestampChip timestamp={timestamp} />
          {textAfter}
        </Box>
      );
    }
    
    return <span {...props}>{children}</span>;
  },
  
  // Lists
  ol: ({ children, ...props }: any) => (
    <Box component="ol" sx={{ pl: 3, mb: 2, '& li': { mb: 1 } }} {...props}>
      {children}
    </Box>
  ),
  
  ul: ({ children, ...props }: any) => (
    <Box component="ul" sx={{ pl: 3, mb: 2, '& li': { mb: 1 } }} {...props}>
      {children}
    </Box>
  ),
  
  li: ({ children, ...props }: any) => (
    <Typography component="li" variant="body1" sx={{ lineHeight: 1.7 }} {...props}>
      {children}
    </Typography>
  ),
  
  // Bold text
  strong: ({ children, ...props }: any) => (
    <Box component="strong" sx={{ fontWeight: 700, color: 'text.primary' }} {...props}>
      {children}
    </Box>
  ),
  
  // Code blocks
  code: ({ children, ...props }: any) => (
    <Box
      component="code"
      sx={{
        bgcolor: 'grey.100',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          bgcolor: 'grey.200',
          transform: 'scale(1.02)',
        },
      }}
      {...props}
    >
      {children}
    </Box>
  ),
  
  pre: ({ children, ...props }: any) => (
    <Fade in timeout={300}>
      <Box
        component="pre"
        sx={{
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 2,
          overflow: 'auto',
          mb: 2,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: 'grey.200',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
        {...props}
      >
        {children}
      </Box>
    </Fade>
  )
};

// Process content to replace references with components
const processContent = (content: string): React.ReactNode => {
  // Split content by paragraphs to process each separately
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, paragraphIndex) => {
    if (!paragraph.trim()) return null;
    
    // Process frame references: [F: videoId_frame_003]
    const frameRegex = /\[F:\s*([a-zA-Z0-9_-]+_frame_\d+)\]/g;
    const timestampRegex = /\[T:\s*(\d+:\d+-\d+:\d+)\]/g;
    
    const elements: any[] = [];
    let lastIndex = 0;
    
    // Find all matches
    const allMatches: Array<{type: 'frame' | 'timestamp', match: RegExpExecArray, index: number}> = [];
    
    let match;
    while ((match = frameRegex.exec(paragraph)) !== null) {
      allMatches.push({ type: 'frame', match, index: match.index });
    }
    frameRegex.lastIndex = 0; // Reset regex
    
    while ((match = timestampRegex.exec(paragraph)) !== null) {
      allMatches.push({ type: 'timestamp', match, index: match.index });
    }
    
    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);
    
    if (allMatches.length === 0) {
      // No references found, render as markdown
      return (
        <ReactMarkdown key={paragraphIndex} components={customComponents}>
          {paragraph}
        </ReactMarkdown>
      );
    }
    
    // Build elements
    allMatches.forEach(({ type, match, index }) => {
      // Add text before match
      if (index > lastIndex) {
        elements.push(paragraph.substring(lastIndex, index));
      }
      
      // Add the component
      if (type === 'frame') {
        elements.push(<FrameImage key={`frame-${paragraphIndex}-${index}`} frameId={match[1]} />);
      } else if (type === 'timestamp') {
        elements.push(<TimestampChip key={`timestamp-${paragraphIndex}-${index}`} timestamp={match[1]} />);
      }
      
      lastIndex = index + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < paragraph.length) {
      elements.push(paragraph.substring(lastIndex));
    }
    
    return (
      <Box key={paragraphIndex} sx={{ mb: 1.5 }}>
        {elements.map((element, elementIndex) => {
          if (typeof element === 'string') {
            return (
              <ReactMarkdown key={`text-${paragraphIndex}-${elementIndex}`} components={customComponents}>
                {element}
              </ReactMarkdown>
            );
          }
          return element;
        })}
      </Box>
    );
  });
};

export default function ChatMessage({ content, role }: ChatMessageProps) {
  return (
    <Fade in timeout={400}>
      <Box sx={{ 
        width: '100%',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {processContent(content)}
      </Box>
    </Fade>
  );
}
