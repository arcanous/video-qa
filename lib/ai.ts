import { createOpenAI } from '@ai-sdk/openai';

export const openai = createOpenAI({ 
  apiKey: process.env.OPENAI_KEY ?? process.env.OPENAI_API_KEY 
});
