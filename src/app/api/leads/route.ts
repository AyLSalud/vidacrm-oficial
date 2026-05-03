import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/leads - List all leads with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const pipelineStageId = searchParams.get('pipelineStageId');
    const priority = searchParams.get('priority');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');

    const where: Prisma.LeadWhereInput = {};

    if (status) where.status = status;
    if (pipelineStageId) where.pipelineStageId = pipelineStageId;
    if (priority) where.priority = priority;
    if (channel) where.channel = channel;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await db.lead.findMany({
      where,
      include: {
        pipelineStage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      channel,
      source,
      pipelineStageId,
      planInterest,
      currentCoverage,
      familyGroup,
      status,
      priority,
      responseStatus,
      nextFollowUp,
      notes,
    } = body;

    if (!firstName || !phone || !pipelineStageId) {
      return NextResponse.json(
        { error: 'firstName, phone, and pipelineStageId are required' },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        channel: channel || 'whatsapp',
        source,
        pipelineStageId,
        planInterest,
        currentCoverage,
        familyGroup,
        status: status || 'active',
        priority: priority || 'medium',
        responseStatus: responseStatus || 'pending',
        lastContact: new Date(),
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        notes,
      },
      include: {
        pipelineStage: true,
      },
    });

    // Create an interaction logging the creation
    await db.interaction.create({
      data: {
        leadId: lead.id,
        type: 'note',
        content: `Lead creado: ${firstName}${lastName ? ' ' + lastName : ''}`,
        metadata: JSON.stringify({ action: 'lead_created' }),
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
