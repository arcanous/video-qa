import { streamText } from 'ai';
import { openai } from '@lib/ai';
import { embedQuery, searchTranscripts, searchFrameCaptions, formatContext, searchTranscriptsMulti, searchFrameCaptionsMulti, formatContextMulti, searchMultimodal } from '@lib/rag';
import { getVideoById } from '@lib/db';
import { analyzeImageWithVision } from '@lib/vision';
import { join } from 'path';
import { existsSync } from 'fs';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('API route received:', body);
    
    // Extract data from the request body - support both single and multiple videos
    const { messages, videoId, videoIds, imageId } = body;
    
    // Normalize to array for consistent handling
    const ids = videoIds || (videoId ? [videoId] : []);
    
    if (ids.length === 0) {
      return Response.json({ error: 'No videos selected' }, { status: 400 });
    }
    
    // Validate all videos exist
    const videoPromises = ids.map(id => getVideoById(id));
    const videos = await Promise.all(videoPromises);
    
    const missingVideos = videos.filter((video, index) => !video);
    if (missingVideos.length > 0) {
      return Response.json({ error: 'One or more videos not found' }, { status: 404 });
    }
    
    // Get last user message
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content;
    
    // Embed user text
    const textEmbedding = await embedQuery(userText);
    
    // Handle image if provided
    let imageCaption: string | null = null;
    if (imageId) {
      try {
        // Try both .jpg and .png extensions
        let imagePath = join(process.cwd(), 'data', 'ask-uploads', `${imageId}.jpg`);
        if (!existsSync(imagePath)) {
          imagePath = join(process.cwd(), 'data', 'ask-uploads', `${imageId}.png`);
        }
        
        if (existsSync(imagePath)) {
          console.log('Analyzing user image:', imageId);
          const analysis = await analyzeImageWithVision(imagePath);
          imageCaption = analysis.caption;
          console.log('Image analysis:', imageCaption);
        }
      } catch (error) {
        console.error('Image analysis failed:', error);
        // Continue without image context
      }
    }
    
    // Multimodal search
    const { transcripts, frames } = await searchMultimodal(
      ids,
      textEmbedding,
      imageCaption,
      8
    );
    
    // Format context
    const context = ids.length === 1
      ? formatContext(transcripts, frames)
      : formatContextMulti(transcripts, frames, imageCaption || undefined);
    
    // Prepare messages
    const videoCount = ids.length;
    const systemPrompt = `You are a helpful assistant for instructional videos. Answer based ONLY on the provided context.

${videoCount > 1 ? `You are searching across ${videoCount} videos. Structure your answer by video when relevant.` : ''}
${imageCaption ? 'The user has provided an image for additional context.' : ''}

FORMATTING RULES:
- Use clear section headers with ## for main topics
- Reference timestamps as [T: 1:23-1:45] (they will be styled automatically)
- Reference frames as [F: frame_id] (images will be displayed automatically)
- When multiple videos, use ### Video: "name" to separate content
- Use numbered lists for step-by-step instructions
- Use **bold** for emphasis

If the context doesn't contain the answer, say so clearly.`;

    const promptMessages: Array<{role: 'user' | 'assistant', content: string}> = [];
    
    // Add user message
    promptMessages.push({ role: 'user', content: userText });
    
    // Add context as assistant message
    if (context) {
      promptMessages.push({
        role: 'assistant',
        content: `Here's the relevant context from the ${videoCount > 1 ? 'videos' : 'video'}:\n\n${context}\n\nNow I'll answer your question based on this context.`
      });
    }
    
    // Stream response
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: promptMessages,
    });
    
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Ask error:', error);
    return Response.json({ error: 'Failed to process' }, { status: 500 });
  }
}
