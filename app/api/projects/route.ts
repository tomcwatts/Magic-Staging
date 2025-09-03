import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthWithOrg } from '@/lib/auth-utils';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long'),
  address: z.string().max(500, 'Address is too long').optional(),
  mlsNumber: z.string().max(50, 'MLS number is too long').optional(),
  propertyType: z.enum(['house', 'condo', 'commercial']).optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
});

const updateProjectSchema = createProjectSchema.partial();

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        ...validatedData,
        organizationId: userWithOrg.organization.id,
        createdBy: userWithOrg.user.id,
      },
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
        id: project.id,
        name: project.name,
        address: project.address,
        mlsNumber: project.mlsNumber,
        propertyType: project.propertyType,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        roomCount: project._count.roomImages,
      }
    });

  } catch (error) {
    console.error('Project creation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      organizationId: userWithOrg.organization.id,
    };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { mlsNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get projects with counts
    const [projects, totalCount] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          _count: {
            select: {
              roomImages: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    // Format response
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      address: project.address,
      mlsNumber: project.mlsNumber,
      propertyType: project.propertyType,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      roomCount: project._count.roomImages,
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}