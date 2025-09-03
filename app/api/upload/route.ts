import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthWithOrg } from '@/lib/auth-utils';
import { validateFile, saveUploadedFile } from '@/lib/local-storage';
import { processImage, validateImageFile, generateThumbnail } from '@/lib/image-processing';

const uploadSchema = z.object({
  projectId: z.string().cuid(),
  roomType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const formData = await request.formData();
    
    // Extract form data
    const projectId = formData.get('projectId') as string;
    const roomType = formData.get('roomType') as string | null;
    const files = formData.getAll('files') as File[];
    
    // Validate input
    const validatedData = uploadSchema.parse({
      projectId,
      roomType: roomType || undefined,
    });
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Verify project exists and belongs to user's organization
    const project = await db.project.findFirst({
      where: {
        id: validatedData.projectId,
        organizationId: userWithOrg.organization.id,
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const uploadResults = [];
    const errors = [];
    
    // Process each file
    for (const file of files) {
      try {
        // Basic file validation first
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }
        
        // Convert file to buffer
        const originalBuffer = Buffer.from(await file.arrayBuffer());
        
        // Validate and process image
        const imageValidation = await validateImageFile(originalBuffer);
        if (!imageValidation.isValid) {
          errors.push(`${file.name}: ${imageValidation.error}`);
          continue;
        }
        
        // Process image for optimization
        const processedResult = await processImage(originalBuffer, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 85,
          format: 'jpeg',
          progressive: true,
        });
        
        // Generate thumbnail for faster loading
        const thumbnailBuffer = await generateThumbnail(processedResult.buffer, 300);
        
        // Save processed image to local storage
        const saveResult = await saveUploadedFile(
          processedResult.buffer,
          file.name,
          'image/jpeg', // Always save as JPEG after processing
          userWithOrg.organization.id,
          validatedData.projectId
        );
        
        if (!saveResult.success || !saveResult.file) {
          errors.push(`${file.name}: ${saveResult.error || 'Upload failed'}`);
          continue;
        }
        
        // Save room image record to database
        const roomImage = await db.roomImage.create({
          data: {
            projectId: validatedData.projectId,
            organizationId: userWithOrg.organization.id,
            filename: saveResult.file.filename,
            s3Key: saveResult.file.path, // Using local path in s3Key field for now
            s3Url: saveResult.file.url,
            fileSize: processedResult.metadata.size,
            mimeType: 'image/jpeg',
            width: processedResult.metadata.width,
            height: processedResult.metadata.height,
            roomType: validatedData.roomType,
            uploadStatus: 'ready',
            createdBy: userWithOrg.user.id,
          },
        });
        
        uploadResults.push({
          id: roomImage.id,
          filename: saveResult.file.filename,
          originalName: saveResult.file.originalName,
          url: saveResult.file.url,
          size: processedResult.metadata.size,
          originalSize: processedResult.metadata.originalSize,
          compressionRatio: processedResult.metadata.compressionRatio,
          mimeType: 'image/jpeg',
          width: processedResult.metadata.width,
          height: processedResult.metadata.height,
          roomType: validatedData.roomType,
        });
      } catch (fileError) {
        console.error(`Failed to process file ${file.name}:`, fileError);
        errors.push(`${file.name}: Processing failed`);
      }
    }
    
    // Return results
    const response = {
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      counts: {
        successful: uploadResults.length,
        failed: errors.length,
        total: files.length,
      },
    };
    
    const statusCode = uploadResults.length > 0 ? 200 : 400;
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    console.error('Upload API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}