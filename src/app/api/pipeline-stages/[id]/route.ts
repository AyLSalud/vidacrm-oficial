import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// PUT /api/pipeline-stages/[id] - Update a pipeline stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.pipelineStage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Pipeline stage not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const stage = await db.pipelineStage.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.objective !== undefined && { objective: body.objective }),
        ...(body.entryCriteria !== undefined && { entryCriteria: body.entryCriteria }),
        ...(body.exitCriteria !== undefined && { exitCriteria: body.exitCriteria }),
        ...(body.suggestedTask !== undefined && { suggestedTask: body.suggestedTask }),
        ...(body.whatsappTemplateKey !== undefined && { whatsappTemplateKey: body.whatsappTemplateKey }),
      },
    });

    return NextResponse.json(stage);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error updating pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline stage' },
      { status: 500 }
    );
  }
}

// DELETE /api/pipeline-stages/[id] - Delete a pipeline stage
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const existing = await db.pipelineStage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Pipeline stage not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if there are leads in this stage
    const leadsCount = await db.lead.count({ where: { pipelineStageId: id } });
    if (leadsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete stage with ${leadsCount} leads. Move leads first.` },
        { status: 400 }
      );
    }

    await db.pipelineStage.delete({ where: { id } });

    return NextResponse.json({ message: 'Pipeline stage deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error deleting pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline stage' },
      { status: 500 }
    );
  }
}
