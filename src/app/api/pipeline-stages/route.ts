import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/pipeline-stages - List all pipeline stages for the authenticated user
export async function GET() {
  try {
    const userId = await requireAuth();

    const stages = await db.pipelineStage.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    const result = stages.map((stage) => ({
      ...stage,
      leadCount: stage._count.leads,
      _count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline-stages - Create a new pipeline stage
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { name, order, color, objective, entryCriteria, exitCriteria, suggestedTask, whatsappTemplateKey } = body;

    if (!name || order === undefined) {
      return NextResponse.json(
        { error: 'Name and order are required' },
        { status: 400 }
      );
    }

    const stage = await db.pipelineStage.create({
      data: {
        name,
        order,
        color: color || '#6366f1',
        objective,
        entryCriteria,
        exitCriteria,
        suggestedTask,
        whatsappTemplateKey,
        userId,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error creating pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline stage' },
      { status: 500 }
    );
  }
}
