import { streamText } from 'ai';
import { openai } from '@lib/ai';
import { embedQuery, searchTranscripts, searchFrameCaptions, formatContext } from '@lib/rag';
import { getVideoById } from '@lib/db';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('API route received:', body);
    
    // Extract data from the request body
    const { messages, videoId, imageId } = body;
    
    // Validate video
    const video = await getVideoById(videoId);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Get last user message
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content;
    
    // RAG: Embed and search
    const embedding = await embedQuery(userText);
    const [transcripts, frames] = await Promise.all([
      searchTranscripts(videoId, embedding, 8),
      searchFrameCaptions(videoId, embedding, 8)
    ]);
    
    // Build context
    const context = formatContext(transcripts, frames);
    
    // Prepare messages
    const systemPrompt = `You are a helpful assistant for an instructional video. Answer based ONLY on the provided context.
Include timestamps like [T: 1:23-1:45] and frame references like [F: frame_003] when relevant.
If the context doesn't contain the answer, say so clearly.`;

    const promptMessages: Array<{role: 'user' | 'assistant', content: string}> = [];
    
    // Add user message (simplified for now - image support can be added later)
    promptMessages.push({ role: 'user', content: userText });
    
    // Add context as assistant message
    if (context) {
      promptMessages.push({
        role: 'assistant',
        content: `Here's the relevant context from the video:\n\n${context}\n\nNow I'll answer your question based on this context.`
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
