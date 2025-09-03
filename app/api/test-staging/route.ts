import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { testStageImage } from "@/lib/gemini-simple";

// Create uploads directory if it doesn't exist
const uploadsDir = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Ensure uploads directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `test-${Date.now()}-${file.name}`;
    const filepath = join(uploadsDir, filename);
    
    await writeFile(filepath, buffer);
    
    // Test with Gemini
    const result = await testStageImage({
      imagePath: filepath,
      prompt: prompt || undefined,
      style: (style as any) || 'modern',
    });
    
    return NextResponse.json({
      success: result.success,
      originalImage: `/uploads/${filename}`,
      analysis: result.success ? 'Analysis completed - check server logs' : undefined,
      error: result.error,
      processingTime: result.processingTime,
    });
    
  } catch (error) {
    console.error('Test staging API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}