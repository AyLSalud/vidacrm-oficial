import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET /api/metrics - Return computed metrics for the authenticated user
export async function GET() {
  try {
    const userId = await requireAuth();

    // Total leads by status
    const leadsByStatus = await db.lead.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { userId },
    });

    const leadsByStatusFormatted = leadsByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Leads by pipeline stage
    const leadsByStage = await db.lead.findMany({
      where: { userId },
      select: {
        pipelineStageId: true,
        pipelineStage: {
          select: { name: true, color: true, order: true },
        },
      },
    });

    const stageCountMap = new Map<string, { name: string; color: string; order: number; count: number }>();
    for (const lead of leadsByStage) {
      const existing = stageCountMap.get(lead.pipelineStageId);
      if (existing) {
        existing.count++;
      } else {
        stageCountMap.set(lead.pipelineStageId, {
          name: lead.pipelineStage.name,
          color: lead.pipelineStage.color,
          order: lead.pipelineStage.order,
          count: 1,
        });
      }
    }
    const leadsByStageFormatted = Array.from(stageCountMap.values()).sort((a, b) => a.order - b.order);

    // Leads by channel
    const leadsByChannel = await db.lead.groupBy({
      by: ['channel'],
      _count: { id: true },
      where: { userId },
    });

    const leadsByChannelFormatted = leadsByChannel.map((item) => ({
      channel: item.channel,
      count: item._count.id,
    }));

    // Conversion rate (won / total)
    const totalLeads = await db.lead.count({ where: { userId } });
    const wonLeads = await db.lead.count({ where: { userId, status: 'won' } });
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) : 0;

    // Tasks completed vs pending
    const tasksCompleted = await db.task.count({ where: { userId, completed: true } });
    const tasksPending = await db.task.count({ where: { userId, completed: false } });

    // Recent leads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await db.lead.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Overdue follow-ups (nextFollowUp < now AND status = active)
    const overdueFollowUps = await db.lead.count({
      where: {
        userId,
        nextFollowUp: { lt: new Date() },
        status: 'active',
      },
    });

    // Leads by priority
    const leadsByPriority = await db.lead.groupBy({
      by: ['priority'],
      _count: { id: true },
      where: { userId },
    });

    const leadsByPriorityFormatted = leadsByPriority.map((item) => ({
      priority: item.priority,
      count: item._count.id,
    }));

    return NextResponse.json({
      leadsByStatus: leadsByStatusFormatted,
      leadsByStage: leadsByStageFormatted,
      leadsByChannel: leadsByChannelFormatted,
      conversionRate: Math.round(conversionRate * 100) / 100,
      tasks: {
        completed: tasksCompleted,
        pending: tasksPending,
      },
      recentLeads,
      overdueFollowUps,
      leadsByPriority: leadsByPriorityFormatted,
      totalLeads,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    console.error('Error computing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to compute metrics' },
      { status: 500 }
    );
  }
}
