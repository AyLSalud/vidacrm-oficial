import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/tasks - List all tasks with lead relation, support filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');
    const leadId = searchParams.get('leadId');
    const dueBefore = searchParams.get('dueBefore');
    const overdue = searchParams.get('overdue');

    const where: Prisma.TaskWhereInput = {};

    if (completed !== null) where.completed = completed === 'true';
    if (leadId) where.leadId = leadId;

    if (dueBefore) {
      where.dueDate = { lte: new Date(dueBefore) };
    }

    if (overdue === 'true') {
      where.completed = false;
      where.dueDate = { lt: new Date() };
    }

    const tasks = await db.task.findMany({
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, title, description, type, dueDate } = body;

    if (!leadId || !title) {
      return NextResponse.json(
        { error: 'leadId and title are required' },
        { status: 400 }
      );
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const task = await db.task.create({
      data: {
        leadId,
        title,
        description,
        type: type || 'follow_up',
        dueDate: dueDate ? new Date(dueDate) : null,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
