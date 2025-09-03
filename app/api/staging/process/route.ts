import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthWithOrg } from '@/lib/auth-utils';
import { processRoomStaging, validateStagingRequest, type StagingJobRequest } from '@/lib/gemini-production';

const processJobSchema = z.object({
  roomImageId: z.string().cuid(),
  prompt: z.string().max(1000).optional(),
  style: z.enum(['modern', 'traditional', 'minimalist', 'luxury', 'contemporary', 'rustic']).default('modern'),
  preferences: z.object({
    colors: z.array(z.string()).optional(),
    furnitureCount: z.enum(['minimal', 'moderate', 'full']).optional(),
    budget: z.enum(['economy', 'mid_range', 'luxury']).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const validatedData = processJobSchema.parse(body);

    // Check if organization has sufficient credits
    if (userWithOrg.organization.creditsRemaining < 1) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          creditsRemaining: userWithOrg.organization.creditsRemaining 
        },
        { status: 402 }
      );
    }

    // Verify room image exists and belongs to user's organization
    const roomImage = await db.roomImage.findFirst({
      where: {
        id: validatedData.roomImageId,
        organizationId: userWithOrg.organization.id,
      },
      include: {
        project: true,
      }
    });

    if (!roomImage) {
      return NextResponse.json(
        { error: "Room image not found" },
        { status: 404 }
      );
    }

    // Create staging job record first
    const stagingJob = await db.stagingJob.create({
      data: {
        roomImageId: validatedData.roomImageId,
        organizationId: userWithOrg.organization.id,
        prompt: validatedData.prompt || '',
        stylePreferences: {
          style: validatedData.style,
          ...validatedData.preferences,
        },
        status: 'processing',
        aiModel: 'gemini-2.5-flash-image-preview',
        processingStartedAt: new Date(),
        createdBy: userWithOrg.user.id,
      },
    });

    // Build staging request
    const stagingRequest: StagingJobRequest = {
      roomImageId: roomImage.s3Key, // This contains the local file path
      organizationId: userWithOrg.organization.id,
      projectId: roomImage.project.id,
      prompt: validatedData.prompt,
      style: validatedData.style,
      preferences: validatedData.preferences,
    };

    // Validate request
    const validation = validateStagingRequest(stagingRequest);
    if (!validation.valid) {
      await db.stagingJob.update({
        where: { id: stagingJob.id },
        data: {
          status: 'failed',
          errorMessage: validation.error,
          processingCompletedAt: new Date(),
        },
      });
      
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    try {
      // Process the staging job
      const result = await processRoomStaging(stagingRequest);

      if (result.success) {
        // Update staging job as completed
        const updatedJob = await db.stagingJob.update({
          where: { id: stagingJob.id },
          data: {
            status: 'completed',
            processingCompletedAt: new Date(),
            aiCostCents: Math.round(result.aiMetadata!.estimatedCost * 100),
          },
        });

        // Create staged image record
        await db.stagedImage.create({
          data: {
            stagingJobId: stagingJob.id,
            organizationId: userWithOrg.organization.id,
            s3Key: result.stagedImagePath!,
            s3Url: result.stagedImageUrl!,
            aiMetadata: result.aiMetadata,
            isApproved: true, // Auto-approve for now
          },
        });

        // Deduct credit from organization
        await db.organization.update({
          where: { id: userWithOrg.organization.id },
          data: {
            creditsRemaining: {
              decrement: 1,
            },
          },
        });

        // Log usage
        await db.usageLog.create({
          data: {
            organizationId: userWithOrg.organization.id,
            userId: userWithOrg.user.id,
            action: 'room_staged',
            resourceId: stagingJob.id,
            aiCostCents: Math.round(result.aiMetadata!.estimatedCost * 100),
            billableCredits: 1,
          },
        });

        return NextResponse.json({
          success: true,
          stagingJobId: stagingJob.id,
          stagedImageUrl: result.stagedImageUrl,
          processingTime: result.processingTime,
          creditsRemaining: userWithOrg.organization.creditsRemaining - 1,
        });

      } else {
        // Update staging job as failed
        await db.stagingJob.update({
          where: { id: stagingJob.id },
          data: {
            status: 'failed',
            errorMessage: result.error,
            processingCompletedAt: new Date(),
          },
        });

        return NextResponse.json(
          { 
            error: result.error || 'AI processing failed',
            processingTime: result.processingTime 
          },
          { status: 500 }
        );
      }

    } catch (processingError) {
      console.error('AI processing error:', processingError);
      
      // Update staging job as failed
      await db.stagingJob.update({
        where: { id: stagingJob.id },
        data: {
          status: 'failed',
          errorMessage: processingError instanceof Error ? processingError.message : 'Processing failed',
          processingCompletedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: 'AI processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Staging job creation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create staging job' },
      { status: 500 }
    );
  }
}