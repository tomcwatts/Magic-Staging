import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Simple interface for testing
export interface SimpleImageRequest {
  imagePath: string;
  prompt?: string;
  style?: 'modern' | 'traditional' | 'minimalist';
}

export interface SimpleImageResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  processingTime: number;
}

export async function testStageImage(request: SimpleImageRequest): Promise<SimpleImageResult> {
  const startTime = Date.now();
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(request.imagePath);
    
    // Get the model - using text generation for now since image generation might not be available
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create the prompt
    const stagingPrompt = buildSimplePrompt(request.prompt, request.style);
    
    // Convert image to base64
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };
    
    // Generate content (this will analyze the image and provide staging suggestions)
    const result = await model.generateContent([stagingPrompt, imagePart]);
    const response = result.response;
    const text = response.text();
    
    // For now, we'll just return the analysis instead of a generated image
    // This helps validate that Gemini can understand room staging requirements
    console.log('AI Analysis:', text);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      outputPath: undefined, // We're not generating images yet, just getting analysis
      processingTime,
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Gemini staging test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    };
  }
}

function buildSimplePrompt(customPrompt?: string, style: string = 'modern'): string {
  let prompt = "Analyze this room image for virtual staging. ";
  prompt += "Describe exactly what furniture, decor, and styling you would add to make this space market-ready for real estate. ";
  
  if (style === 'modern') {
    prompt += "Use a modern style with clean lines, neutral colors, and contemporary furniture. ";
  } else if (style === 'traditional') {
    prompt += "Use a traditional style with classic furniture and warm colors. ";
  } else if (style === 'minimalist') {
    prompt += "Use a minimalist approach with very few, carefully selected pieces. ";
  }
  
  if (customPrompt) {
    prompt += `Additional requirements: ${customPrompt} `;
  }
  
  prompt += "Be specific about furniture placement, colors, lighting, and accessories. ";
  prompt += "Provide a detailed staging plan that a professional would use.";
  
  return prompt;
}