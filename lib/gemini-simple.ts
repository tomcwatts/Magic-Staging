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
    
    // Get the image generation model - using the correct image preview model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
    // Create the staging prompt for image generation
    const stagingPrompt = buildImageGenerationPrompt(request.prompt, request.style);
    
    // Convert image to base64
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };
    
    // Generate staged image
    const result = await model.generateContent([stagingPrompt, imagePart]);
    
    // Try to extract generated image
    let generatedImageBuffer: Buffer | null = null;
    try {
      generatedImageBuffer = await extractImageFromResponse(result);
      console.log('Generated staged image successfully');
    } catch (imageError) {
      console.log('Image generation not available, falling back to analysis');
      // Fallback to text analysis if image generation fails
      const response = result.response;
      const text = response.text();
      console.log('AI Analysis:', text);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save generated image if we have one
    if (generatedImageBuffer && generatedImageBuffer.length > 0) {
      const outputFilename = `staged-${Date.now()}.jpg`;
      const outputPath = `public/uploads/${outputFilename}`;
      fs.writeFileSync(outputPath, generatedImageBuffer);
      
      return {
        success: true,
        outputPath: `/uploads/${outputFilename}`,
        processingTime,
      };
    }
    
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

function buildImageGenerationPrompt(customPrompt?: string, style: string = 'modern'): string {
  let prompt = "Generate a professionally staged version of this empty room. ";
  prompt += "Add realistic furniture, decor, and styling to make this space market-ready for real estate photography. ";
  
  // Style-specific instructions
  if (style === 'modern') {
    prompt += "Use modern style: clean lines, neutral colors (whites, grays, blacks), contemporary furniture, minimal decor, and sleek lighting fixtures. ";
  } else if (style === 'traditional') {
    prompt += "Use traditional style: classic furniture pieces, warm colors (browns, creams, navy), elegant patterns, and traditional accessories. ";
  } else if (style === 'minimalist') {
    prompt += "Use minimalist style: very few furniture pieces, lots of white space, simple geometric forms, and maximum 3-4 carefully chosen items. ";
  }
  
  // Technical requirements
  prompt += "Maintain the exact room architecture, lighting, and perspective. ";
  prompt += "Add realistic shadows under all furniture. ";
  prompt += "Ensure all furniture is properly scaled and naturally positioned. ";
  prompt += "Keep the same lighting conditions and window views. ";
  
  if (customPrompt) {
    prompt += `Additional specific requirements: ${customPrompt} `;
  }
  
  prompt += "The result should look photorealistic and professional for real estate marketing.";
  
  return prompt;
}

async function extractImageFromResponse(result: any): Promise<Buffer> {
  try {
    // Check various possible response structures for image data
    const response = result.response;
    
    // Check if there's image data in candidates
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/')) {
          console.log('Found image data in response');
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }
    
    // Check for other possible image data locations
    if (response?.image?.data) {
      return Buffer.from(response.image.data, 'base64');
    }
    
    throw new Error('No image data found in AI response');
    
  } catch (error) {
    console.error('Failed to extract image from AI response:', error);
    throw new Error('Failed to process AI-generated image');
  }
}