import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { saveUploadedFile } from '@/lib/local-storage';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface StagingJobRequest {
  roomImageId: string;
  organizationId: string;
  projectId: string;
  prompt?: string;
  style: 'modern' | 'traditional' | 'minimalist' | 'luxury' | 'contemporary' | 'rustic';
  preferences?: {
    colors?: string[];
    furnitureCount?: 'minimal' | 'moderate' | 'full';
    budget?: 'economy' | 'mid_range' | 'luxury';
  };
}

export interface StagingJobResult {
  success: boolean;
  stagedImagePath?: string;
  stagedImageUrl?: string;
  processingTime: number;
  error?: string;
  aiMetadata?: {
    model: string;
    prompt: string;
    style: string;
    estimatedCost: number;
  };
}

export async function processRoomStaging(request: StagingJobRequest): Promise<StagingJobResult> {
  const startTime = Date.now();
  
  try {
    // Get the image generation model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
    // Build the staging prompt
    const stagingPrompt = buildProductionStagingPrompt(
      request.prompt,
      request.style,
      request.preferences
    );
    
    // Read the original image (we'll need to get the file path from the database)
    // For now, we'll assume the s3Key field contains the local file path
    // In production with AWS, this would fetch from S3
    const roomImageBuffer = fs.readFileSync(request.roomImageId); // This needs to be the actual file path
    
    // Convert image to format Gemini expects
    const imagePart = {
      inlineData: {
        data: roomImageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };
    
    // Generate staged image
    const result = await model.generateContent([stagingPrompt, imagePart]);
    
    // Extract generated image
    const generatedImageBuffer = await extractImageFromResponse(result);
    
    if (!generatedImageBuffer || generatedImageBuffer.length === 0) {
      throw new Error('No image data received from AI model');
    }
    
    // Save the staged image
    const timestamp = Date.now();
    const stagedFilename = `staged_${timestamp}.jpg`;
    
    const saveResult = await saveUploadedFile(
      generatedImageBuffer,
      stagedFilename,
      'image/jpeg',
      request.organizationId,
      request.projectId,
      'staged'
    );
    
    if (!saveResult.success || !saveResult.file) {
      throw new Error('Failed to save staged image');
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      stagedImagePath: saveResult.file.path,
      stagedImageUrl: saveResult.file.url,
      processingTime,
      aiMetadata: {
        model: 'gemini-2.5-flash-image-preview',
        prompt: stagingPrompt,
        style: request.style,
        estimatedCost: 0.039, // $0.039 per image
      },
    };
    
  } catch (error) {
    console.error('Room staging failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function buildProductionStagingPrompt(
  customPrompt?: string,
  style: string = 'modern',
  preferences?: StagingJobRequest['preferences']
): string {
  let prompt = "Generate a professionally staged version of this empty room. ";
  prompt += "Add realistic furniture, decor, and styling to make this space market-ready for real estate photography. ";
  
  // Style-specific instructions
  const styleGuides = {
    modern: "Use modern style: clean lines, neutral colors (whites, grays, blacks), contemporary furniture, minimal decor, and sleek lighting fixtures. ",
    traditional: "Use traditional style: classic furniture pieces, warm colors (browns, creams, navy), elegant patterns, and traditional accessories. ",
    minimalist: "Use minimalist style: very few furniture pieces, lots of white space, simple geometric forms, and maximum 3-4 carefully chosen items. ",
    luxury: "Use luxury style: high-end furniture, rich materials (marble, hardwood, leather), sophisticated color palette, and premium accessories. ",
    contemporary: "Use contemporary style: blend modern and traditional elements with current design trends, mixed textures, and statement pieces. ",
    rustic: "Use rustic style: natural wood elements, warm earth tones, cozy textures, and farmhouse-style accessories. "
  };
  
  prompt += styleGuides[style] || styleGuides.modern;
  
  // Add preferences if provided
  if (preferences) {
    if (preferences.colors && preferences.colors.length > 0) {
      prompt += `Incorporate these specific colors: ${preferences.colors.join(', ')}. `;
    }
    
    if (preferences.furnitureCount) {
      const furnitureGuides = {
        minimal: "Use only essential furniture pieces to avoid clutter. ",
        moderate: "Include a comfortable amount of furniture without overcrowding. ",
        full: "Fully furnish the space with all necessary and decorative pieces. "
      };
      prompt += furnitureGuides[preferences.furnitureCount];
    }
    
    if (preferences.budget) {
      const budgetGuides = {
        economy: "Focus on affordable, practical furniture choices. ",
        mid_range: "Balance quality and cost with mid-tier furniture selections. ",
        luxury: "Use high-end, designer-quality furniture and accessories. "
      };
      prompt += budgetGuides[preferences.budget];
    }
  }
  
  // Technical requirements for realistic results
  prompt += "IMPORTANT TECHNICAL REQUIREMENTS: ";
  prompt += "1. Maintain the exact room architecture, walls, windows, doors, and lighting conditions. ";
  prompt += "2. Add realistic shadows under all furniture pieces. ";
  prompt += "3. Ensure all furniture is properly scaled and naturally positioned. ";
  prompt += "4. Keep the same perspective and camera angle as the original. ";
  prompt += "5. Match the existing lighting conditions and time of day. ";
  prompt += "6. Preserve any existing built-in features like fireplaces, built-ins, or fixtures. ";
  
  if (customPrompt && customPrompt.trim()) {
    prompt += `ADDITIONAL SPECIFIC REQUIREMENTS: ${customPrompt.trim()} `;
  }
  
  prompt += "The final result must look photorealistic and professional for real estate marketing, indistinguishable from a professionally photographed staged room.";
  
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
          console.log('Found staged image data in AI response');
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

// Utility function to validate staging request
export function validateStagingRequest(request: StagingJobRequest): { valid: boolean; error?: string } {
  if (!request.roomImageId) {
    return { valid: false, error: 'Room image ID is required' };
  }
  
  if (!request.organizationId) {
    return { valid: false, error: 'Organization ID is required' };
  }
  
  if (!request.projectId) {
    return { valid: false, error: 'Project ID is required' };
  }
  
  const validStyles = ['modern', 'traditional', 'minimalist', 'luxury', 'contemporary', 'rustic'];
  if (!validStyles.includes(request.style)) {
    return { valid: false, error: 'Invalid style selection' };
  }
  
  return { valid: true };
}