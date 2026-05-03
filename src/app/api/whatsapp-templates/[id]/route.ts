import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// PUT /api/whatsapp-templates/[id] - Update a WhatsApp template (requires auth)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.whatsAppTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp template not found' },
        { status: 404 }
      );
    }

    const template = await db.whatsAppTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.formalText !== undefined && { formalText: body.formalText }),
        ...(body.friendlyText !== undefined && { friendlyText: body.friendlyText }),
        ...(body.briefText !== undefined && { briefText: body.briefText }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error updating WhatsApp template:', error);
    return NextResponse.json(
      { error: 'Failed to update WhatsApp template' },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp-templates/[id] - Delete a WhatsApp template (requires auth)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const existing = await db.whatsAppTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp template not found' },
        { status: 404 }
      );
    }

    await db.whatsAppTemplate.delete({ where: { id } });

    return NextResponse.json({ message: 'WhatsApp template deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error deleting WhatsApp template:', error);
    return NextResponse.json(
      { error: 'Failed to delete WhatsApp template' },
      { status: 500 }
    );
  }
}
