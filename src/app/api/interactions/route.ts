import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/interactions - List interactions for the authenticated user with filters
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const type = searchParams.get('type');

    const where: Prisma.InteractionWhereInput = { userId };

    if (leadId) where.leadId = leadId;
    if (type) where.type = type;

    const interactions = await db.interaction.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(interactions);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

// POST /api/interactions - Create a new interaction
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { leadId, type, content, metadata } = body;

    if (!leadId || !type || !content) {
      return NextResponse.json(
        { error: 'leadId, type, and content are required' },
        { status: 400 }
      );
    }

    // Verify the lead belongs to the user
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (lead.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const interaction = await db.interaction.create({
      data: {
        leadId,
        type,
        content,
        metadata,
        userId,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Update lastContact on the lead
    await db.lead.update({
      where: { id: leadId },
      data: { lastContact: new Date() },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}
