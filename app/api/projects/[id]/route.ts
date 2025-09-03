import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthWithOrg } from '@/lib/auth-utils';

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long').optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  mlsNumber: z.string().max(50, 'MLS number is too long').optional(),
  propertyType: z.enum(['house', 'condo', 'commercial']).optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const projectId = params.id;

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: userWithOrg.organization.id,
      },
      include: {
        roomImages: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            roomImages: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Format room images
    const roomImages = project.roomImages.map(image => ({
      id: image.id,
      filename: image.filename,
      url: image.s3Url,
      roomType: image.roomType,
      width: image.width,
      height: image.height,
      fileSize: image.fileSize,
      mimeType: image.mimeType,
      uploadStatus: image.uploadStatus,
      createdAt: image.createdAt,
    }));

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        mlsNumber: project.mlsNumber,
        propertyType: project.propertyType,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        roomCount: project._count.roomImages,
        roomImages,
      },
    });

  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const projectId = params.id;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Check if project exists and belongs to user's organization
    const existingProject = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: userWithOrg.organization.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: validatedData,
      include: {
        _count: {
          select: {
            roomImages: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        address: updatedProject.address,
        mlsNumber: updatedProject.mlsNumber,
        propertyType: updatedProject.propertyType,
        status: updatedProject.status,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
        roomCount: updatedProject._count.roomImages,
      },
    });

  } catch (error) {
    console.error('Failed to update project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const projectId = params.id;

    // Check if project exists and belongs to user's organization
    const existingProject = await db.project.findFirst({
      where: {
        id: projectId,
        organizationId: userWithOrg.organization.id,
      },
      include: {
        roomImages: true,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // TODO: Delete associated files from storage when implementing
    // For now, we rely on CASCADE delete in the database

    // Delete project (this will cascade delete room images)
    await db.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}