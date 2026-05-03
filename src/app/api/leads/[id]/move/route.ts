import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/leads/[id]/move - Move a lead to a different pipeline stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pipelineStageId } = body;

    if (!pipelineStageId) {
      return NextResponse.json(
        { error: 'pipelineStageId is required' },
        { status: 400 }
      );
    }

    const existing = await db.lead.findUnique({
      where: { id },
      include: { pipelineStage: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (existing.pipelineStageId === pipelineStageId) {
      return NextResponse.json(
        { error: 'Lead is already in this stage' },
        { status: 400 }
      );
    }

    const newStage = await db.pipelineStage.findUnique({
      where: { id: pipelineStageId },
    });
    if (!newStage) {
      return NextResponse.json(
        { error: 'Target pipeline stage not found' },
        { status: 404 }
      );
    }

    // Update lead and create interaction in a transaction
    const [lead] = await db.$transaction([
      db.lead.update({
        where: { id },
        data: {
          pipelineStageId,
          lastContact: new Date(),
        },
        include: {
          pipelineStage: true,
        },
      }),
      db.interaction.create({
        data: {
          leadId: id,
          type: 'stage_change',
          content: `Etapa cambiada: ${existing.pipelineStage.name} → ${newStage.name}`,
          metadata: JSON.stringify({
            fromStageId: existing.pipelineStageId,
            fromStageName: existing.pipelineStage.name,
            toStageId: pipelineStageId,
            toStageName: newStage.name,
          }),
        },
      }),
    ]);

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error moving lead:', error);
    return NextResponse.json(
      { error: 'Failed to move lead' },
      { status: 500 }
    );
  }
}
