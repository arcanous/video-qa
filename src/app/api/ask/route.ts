import { streamText } from 'ai';
import { openai } from '@lib/ai';
import { embedQuery, searchTranscripts, searchFrameCaptions, formatContext, searchTranscriptsMulti, searchFrameCaptionsMulti, formatContextMulti } from '@lib/rag';
import { getVideoById } from '@lib/db';

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
    
    // RAG: Embed and search
    const embedding = await embedQuery(userText);
    
    let transcripts, frames, context;
    
    if (ids.length === 1) {
      // Single video - use original functions
      [transcripts, frames] = await Promise.all([
        searchTranscripts(ids[0], embedding, 8),
        searchFrameCaptions(ids[0], embedding, 8)
      ]);
      context = formatContext(transcripts, frames);
    } else {
      // Multiple videos - use multi functions
      [transcripts, frames] = await Promise.all([
        searchTranscriptsMulti(ids, embedding, 8),
        searchFrameCaptionsMulti(ids, embedding, 8)
      ]);
      context = formatContextMulti(transcripts, frames);
    }
    
    // Prepare messages
    const videoCount = ids.length;
    const systemPrompt = `You are a helpful assistant for instructional videos. Answer based ONLY on the provided context.
${videoCount > 1 ? `You are searching across ${videoCount} videos.` : ''}
Include timestamps like [T: 1:23-1:45] and frame references like [F: frame_id] when relevant.
Use markdown formatting: **bold**, paragraphs, and lists.
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
