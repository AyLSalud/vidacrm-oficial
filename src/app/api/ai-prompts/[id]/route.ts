import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// PUT /api/ai-prompts/[id] - Update an AI prompt (requires auth)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.aIPrompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'AI prompt not found' },
        { status: 404 }
      );
    }

    const prompt = await db.aIPrompt.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.promptText !== undefined && { promptText: body.promptText }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error updating AI prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update AI prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-prompts/[id] - Delete an AI prompt (requires auth)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const existing = await db.aIPrompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'AI prompt not found' },
        { status: 404 }
      );
    }

    await db.aIPrompt.delete({ where: { id } });

    return NextResponse.json({ message: 'AI prompt deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error deleting AI prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI prompt' },
      { status: 500 }
    );
  }
}
