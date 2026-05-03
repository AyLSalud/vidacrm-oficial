import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/leads/[id] - Get single lead with pipelineStage, tasks, and interactions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        pipelineStage: true,
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (lead.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const body = await request.json();

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

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // If pipelineStageId changes, verify the new stage belongs to the user
    if (body.pipelineStageId && body.pipelineStageId !== existing.pipelineStageId) {
      const newStage = await db.pipelineStage.findUnique({
        where: { id: body.pipelineStageId },
      });

      if (!newStage || newStage.userId !== userId) {
        return NextResponse.json(
          { error: 'Target pipeline stage not found or not owned by user' },
          { status: 400 }
        );
      }

      await db.interaction.create({
        data: {
          leadId: id,
          type: 'stage_change',
          content: `Etapa cambiada: ${existing.pipelineStage.name} → ${newStage?.name || 'Desconocido'}`,
          metadata: JSON.stringify({
            fromStageId: existing.pipelineStageId,
            fromStageName: existing.pipelineStage.name,
            toStageId: body.pipelineStageId,
            toStageName: newStage?.name || 'Desconocido',
          }),
          userId,
        },
      });
    }

    // Fields that should trigger lastContact update
    const contactFields = ['status', 'responseStatus', 'priority', 'notes', 'planInterest'];
    const shouldUpdateLastContact = contactFields.some(
      (field) => body[field] !== undefined && body[field] !== (existing as Record<string, unknown>)[field]
    );

    const lead = await db.lead.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.channel !== undefined && { channel: body.channel }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.pipelineStageId !== undefined && { pipelineStageId: body.pipelineStageId }),
        ...(body.planInterest !== undefined && { planInterest: body.planInterest }),
        ...(body.currentCoverage !== undefined && { currentCoverage: body.currentCoverage }),
        ...(body.familyGroup !== undefined && { familyGroup: body.familyGroup }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.responseStatus !== undefined && { responseStatus: body.responseStatus }),
        ...(body.nextFollowUp !== undefined && { nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null }),
        ...(body.followUpCount !== undefined && { followUpCount: body.followUpCount }),
        ...(body.finalResult !== undefined && { finalResult: body.finalResult }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(shouldUpdateLastContact && { lastContact: new Date() }),
      },
      include: {
        pipelineStage: true,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await db.lead.delete({ where: { id } });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
