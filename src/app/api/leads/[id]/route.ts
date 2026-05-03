import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/leads/[id] - Get single lead with pipelineStage, tasks, and interactions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    return NextResponse.json(lead);
  } catch (error) {
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

    // If pipelineStageId changes, create a stage_change interaction
    if (body.pipelineStageId && body.pipelineStageId !== existing.pipelineStageId) {
      const newStage = await db.pipelineStage.findUnique({
        where: { id: body.pipelineStageId },
      });

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
    const { id } = await params;

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    await db.lead.delete({ where: { id } });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
