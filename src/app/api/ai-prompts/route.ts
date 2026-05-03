import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/ai-prompts - List all AI prompts (public, no auth needed for read)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Prisma.AIPromptWhereInput = {};

    if (category) where.category = category;

    const prompts = await db.aIPrompt.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching AI prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI prompts' },
      { status: 500 }
    );
  }
}

// POST /api/ai-prompts - Create a new AI prompt (requires auth)
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, category, promptText, description, isActive } = body;

    if (!name || !category || !promptText) {
      return NextResponse.json(
        { error: 'name, category, and promptText are required' },
        { status: 400 }
      );
    }

    const prompt = await db.aIPrompt.create({
      data: {
        name,
        category,
        promptText,
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error creating AI prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create AI prompt' },
      { status: 500 }
    );
  }
}
