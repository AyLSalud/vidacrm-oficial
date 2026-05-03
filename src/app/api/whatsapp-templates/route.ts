import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getAuthUserId, requireAuth } from '@/lib/auth-helpers';

// GET /api/whatsapp-templates - List all WhatsApp templates (public, no auth needed for read)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: Prisma.WhatsAppTemplateWhereInput = {};

    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    const templates = await db.whatsAppTemplate.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp templates' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp-templates - Create a new WhatsApp template (requires auth)
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { name, category, formalText, friendlyText, briefText, isActive } = body;

    if (!name || !category || !formalText || !friendlyText || !briefText) {
      return NextResponse.json(
        { error: 'name, category, formalText, friendlyText, and briefText are required' },
        { status: 400 }
      );
    }

    const template = await db.whatsAppTemplate.create({
      data: {
        name,
        category,
        formalText,
        friendlyText,
        briefText,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error creating WhatsApp template:', error);
    return NextResponse.json(
      { error: 'Failed to create WhatsApp template' },
      { status: 500 }
    );
  }
}
