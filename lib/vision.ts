import OpenAI from 'openai';
import { readFile } from 'fs/promises';

// TypeScript interfaces matching Python vision.py exactly
export interface ControlItem {
  label: string;
  kind: string;
  reading: string;
  units: string;
}

export interface TextOnScreen {
  text: string;
  confidence: number;
}

export interface VisionAnalysis {
  caption: string;
  controls: ControlItem[];
  text_on_screen: TextOnScreen[];
}

/**
 * Analyze image using OpenAI GPT-4o Vision with structured outputs
 * TypeScript port of Python vision.py analyze_frame_with_vision function
 */
export async function analyzeImageWithVision(imagePath: string): Promise<VisionAnalysis> {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_KEY ?? process.env.OPENAI_API_KEY
    });
    
    console.log(`Analyzing image with vision: ${imagePath}`);
    
    // Read and encode image to base64
    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Define structured output schema (matching Python version)
    const schema = {
      type: "object",
      properties: {
        caption: {
          type: "string",
          description: "Detailed caption describing the scene"
        },
        controls: {
          type: "array",
          description: "List of controls visible in the image",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                description: "Label or name of the control"
              },
              kind: {
                type: "string",
                description: "Type of control (button, dial, switch, etc.)"
              },
              reading: {
                type: "string",
                description: "Current reading or value"
              },
              units: {
                type: "string",
                description: "Units of measurement if applicable"
              }
            },
            required: ["label", "kind", "reading", "units"],
            additionalProperties: false
          }
        },
        text_on_screen: {
          type: "array",
          description: "Text detected on screen",
          items: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The text content"
              },
              confidence: {
                type: "number",
                description: "Confidence score 0-1",
                minimum: 0,
                maximum: 1
              }
            },
            required: ["text", "confidence"],
            additionalProperties: false
          }
        }
      },
      required: ["caption", "controls", "text_on_screen"],
      additionalProperties: false
    };
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image and provide a detailed description. Focus on:\n1. What is happening in the scene\n2. Any controls, buttons, dials, or interfaces visible\n3. Any text or labels that appear on screen\n4. The overall context and setting\n\nBe thorough and accurate in your analysis."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vision_analysis",
          schema: schema,
          strict: true
        }
      },
      temperature: 0.1
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from vision API');
    }
    
    // Parse and validate the structured response
    const analysisData = JSON.parse(content);
    const analysis: VisionAnalysis = {
      caption: analysisData.caption,
      controls: analysisData.controls || [],
      text_on_screen: analysisData.text_on_screen || []
    };
    
    console.log(`Vision analysis completed: ${analysis.controls.length} controls, ${analysis.text_on_screen.length} text items`);
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing image with vision:', error);
    
    // Return minimal structure on error (matching Python version)
    return {
      caption: `Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      controls: [],
      text_on_screen: []
    };
  }
}
