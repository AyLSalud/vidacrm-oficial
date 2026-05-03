'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  MessageCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCRMStore } from '@/store/crm-store'
import {
  timeAgo,
  getChannelLabel,
  getPriorityLabel,
  getWhatsAppLink,
  isOverdue,
  formatFollowUp,
  getInteractionIcon,
  getInteractionColor,
} from '@/lib/format'

// ============================================
// TYPES
// ============================================

interface Metrics {
  leadsByStatus: { status: string; count: number }[]
  leadsByStage: { name: string; color: string; order: number; count: number }[]
  leadsByChannel: { channel: string; count: number }[]
  conversionRate: number
  tasks: { completed: number; pending: number }
  recentLeads: number
  overdueFollowUps: number
  leadsByPriority: { priority: string; count: number }[]
  totalLeads: number
}

interface InteractionItem {
  id: string
  leadId: string
  type: string
  content: string
  metadata: string | null
  createdAt: string
  lead: {
    id: string
    firstName: string
    lastName: string | null
    phone: string
  }
}

interface LeadWithOverdue {
  id: string
  firstName: string
  lastName: string | null
  phone: string
  nextFollowUp: string | null
  pipelineStage: { name: string; color: string }
  priority: string
}

// ============================================
// COLORS
// ============================================

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#22c55e',
  instagram: '#ec4899',
  facebook: '#3b82f6',
  google: '#ef4444',
  referido: '#a855f7',
  otro: '#6b7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

// ============================================
// STAT CARD
// ============================================

function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  variant = 'default',
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  variant?: 'default' | 'danger'
}) {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              variant === 'danger' ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {value}
          </p>
          {trendLabel && (
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' && <TrendingUp className="size-3 text-emerald-500" />}
              <span
                className={`text-xs ${
                  trend === 'up'
                    ? 'text-emerald-600'
                    : trend === 'down'
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-2 rounded-lg ${
            variant === 'danger' ? 'bg-red-100' : 'bg-emerald-100'
          }`}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ============================================
// RECENT ACTIVITY ITEM
// ============================================

function ActivityItem({ interaction }: { interaction: InteractionItem }) {
  const icon = getInteractionIcon(interaction.type)
  const colorClass = getInteractionColor(interaction.type)
  const leadName = `${interaction.lead.firstName}${interaction.lead.lastName ? ` ${interaction.lead.lastName}` : ''}`

  let content = interaction.content

  // Parse stage change metadata
  if (interaction.type === 'stage_change' && interaction.metadata) {
    try {
      const meta = JSON.parse(interaction.metadata)
      content = `${leadName} movido de "${meta.fromStageName || 'Anterior'}" a "${meta.toStageName || 'Siguiente'}"`
    } catch {
      // use default content
    }
  }

  return (
    <div className="flex gap-3 py-2">
      <div className={`shrink-0 p-1.5 rounded-full border ${colorClass}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-700 leading-relaxed">{content}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{leadName}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{timeAgo(interaction.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// OVERDUE LEAD ITEM
// ============================================

function OverdueLeadItem({ lead }: { lead: LeadWithOverdue }) {
  const { setSelectedLeadId, setLeadDrawerOpen } = useCRMStore()

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <button
          onClick={() => {
            setSelectedLeadId(lead.id)
            setLeadDrawerOpen(true)
          }}
          className="text-sm font-medium text-gray-900 hover:text-emerald-700 hover:underline truncate block"
        >
          {lead.firstName}{lead.lastName ? ` ${lead.lastName}` : ''}
        </button>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{
              borderColor: lead.pipelineStage.color,
              color: lead.pipelineStage.color,
            }}
          >
            {lead.pipelineStage.name}
          </Badge>
          <span className="text-xs text-red-500 font-medium">
            {formatFollowUp(lead.nextFollowUp)}
          </span>
        </div>
      </div>
      <a
        href={getWhatsAppLink(lead.phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
        title="Enviar WhatsApp"
      >
        <MessageCircle className="size-4" />
      </a>
    </div>
  )
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string; count: number; color: string } }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-600">{payload[0].value} leads</p>
      </div>
    )
  }
  return null
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export function DashboardView() {
  const { setSelectedLeadId, setLeadDrawerOpen } = useCRMStore()

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics')
      if (!res.ok) throw new Error('Error fetching metrics')
      return res.json()
    },
  })

  // Fetch recent interactions
  const { data: interactions = [] } = useQuery<InteractionItem[]>({
    queryKey: ['recent-interactions'],
    queryFn: async () => {
      const res = await fetch('/api/interactions')
      if (!res.ok) throw new Error('Error fetching interactions')
      return res.json()
    },
    select: (data) => data.slice(0, 10),
  })

  // Fetch leads with overdue follow-ups
  const { data: overdueLeads = [] } = useQuery<LeadWithOverdue[]>({
    queryKey: ['overdue-leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads?status=active')
      if (!res.ok) throw new Error('Error fetching leads')
      const allLeads = await res.json()
      return allLeads.filter(
        (lead: LeadWithOverdue) => lead.nextFollowUp && isOverdue(lead.nextFollowUp)
      )
    },
  })

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!metrics) return null

  // Compute stats
  const activeLeads = metrics.leadsByStatus.find((s) => s.status === 'active')?.count ?? 0
  const totalLeads = metrics.totalLeads

  // Pipeline funnel data (sorted by order)
  const pipelineData = metrics.leadsByStage.map((stage) => ({
    name: stage.name,
    count: stage.count,
    color: stage.color,
  }))

  // Channel data
  const channelData = metrics.leadsByChannel.map((ch) => ({
    name: getChannelLabel(ch.channel),
    value: ch.count,
    channel: ch.channel,
  }))

  // Priority data
  const priorityData = metrics.leadsByPriority
    .map((p) => ({
      name: getPriorityLabel(p.priority),
      count: p.count,
      priority: p.priority,
      color: PRIORITY_COLORS[p.priority] || '#6b7280',
    }))
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (order[a.priority] ?? 99) - (order[b.priority] ?? 99)
    })

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50">
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
          <p className="text-xs text-gray-500">Resumen de tu actividad de ventas</p>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Leads Activos"
            value={activeLeads}
            icon={<Users className="size-5 text-emerald-600" />}
            trend="up"
            trendLabel={`${metrics.recentLeads} esta semana`}
          />
          <StatCard
            title="Tasa de Conversión"
            value={`${(metrics.conversionRate * 100).toFixed(1)}%`}
            icon={<TrendingUp className="size-5 text-emerald-600" />}
            trend="neutral"
            trendLabel={`${metrics.leadsByStatus.find((s) => s.status === 'won')?.count ?? 0} ganados`}
          />
          <StatCard
            title="Leads Esta Semana"
            value={metrics.recentLeads}
            icon={<Calendar className="size-5 text-emerald-600" />}
            trend="up"
            trendLabel="Últimos 7 días"
          />
          <StatCard
            title="Seguimientos Vencidos"
            value={metrics.overdueFollowUps}
            icon={<AlertTriangle className="size-5 text-red-600" />}
            variant={metrics.overdueFollowUps > 0 ? 'danger' : 'default'}
            trend={metrics.overdueFollowUps > 0 ? 'down' : 'neutral'}
            trendLabel={metrics.overdueFollowUps > 0 ? 'Requieren atención' : 'Todo al día'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline Funnel */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Leads por Etapa del Pipeline
            </h3>
            {pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, pipelineData.length * 36)}>
                <BarChart
                  data={pipelineData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Sin datos
              </div>
            )}
          </Card>

          {/* Leads by Channel */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Leads por Canal
            </h3>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHANNEL_COLORS[entry.channel] || '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} leads`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Sin datos
              </div>
            )}
          </Card>
        </div>

        {/* Priority + Overdue Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Leads by Priority */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Leads por Prioridad
            </h3>
            <div className="space-y-3">
              {priorityData.map((p) => {
                const maxCount = Math.max(...priorityData.map((x) => x.count), 1)
                const widthPercent = (p.count / maxCount) * 100
                return (
                  <div key={p.priority} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 w-12 shrink-0">
                      {p.name}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {p.count}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Task summary */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-xs text-gray-600">
                  {metrics.tasks.completed} tareas completadas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                <span className="text-xs text-gray-600">
                  {metrics.tasks.pending} pendientes
                </span>
              </div>
            </div>
          </Card>

          {/* Overdue Follow-ups */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Seguimientos Vencidos
              </h3>
              {overdueLeads.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {overdueLeads.length}
                </Badge>
              )}
            </div>
            {overdueLeads.length > 0 ? (
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {overdueLeads.map((lead) => (
                  <OverdueLeadItem key={lead.id} lead={lead} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckCircle2 className="size-8 mb-2" />
                <p className="text-xs">No hay seguimientos vencidos</p>
                <p className="text-xs text-gray-300">¡Todo al día!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Actividad Reciente
          </h3>
          {interactions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {interactions.map((interaction) => (
                <ActivityItem key={interaction.id} interaction={interaction} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Clock className="size-8 mb-2" />
              <p className="text-xs">Sin actividad reciente</p>
            </div>
          )}
        </Card>

        {/* Status Summary Footer */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Resumen por Estado
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.leadsByStatus.map((s) => {
              const colors: Record<string, { bg: string; text: string; label: string }> = {
                active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Activos' },
                won: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ganados' },
                lost: { bg: 'bg-red-50', text: 'text-red-700', label: 'Perdidos' },
                paused: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'En pausa' },
              }
              const c = colors[s.status] || { bg: 'bg-gray-50', text: 'text-gray-700', label: s.status }
              const pct = totalLeads > 0 ? ((s.count / totalLeads) * 100).toFixed(0) : '0'

              return (
                <div
                  key={s.status}
                  className={`${c.bg} rounded-lg p-3 text-center`}
                >
                  <p className={`text-2xl font-bold ${c.text}`}>{s.count}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{c.label}</p>
                  <p className="text-[10px] text-gray-400">{pct}% del total</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
