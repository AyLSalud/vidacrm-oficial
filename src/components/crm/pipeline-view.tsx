'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Phone,
  Clock,
  AlertTriangle,
  MessageCircle,
  Filter,
  Users,
  UserPlus,
  CalendarClock,
  Loader2,
} from 'lucide-react'
import { useCRMStore } from '@/store/crm-store'
import {
  timeAgo,
  formatFollowUp,
  getWhatsAppLink,
  getPriorityColor,
  getPriorityLabel,
  getResponseStatusIcon,
  getChannelIcon,
  getChannelLabel,
  isOverdue,
} from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ============================================
// TYPES
// ============================================

interface PipelineStageType {
  id: string
  name: string
  order: number
  color: string
  objective: string | null
  entryCriteria: string | null
  exitCriteria: string | null
  suggestedTask: string | null
  whatsappTemplateKey: string | null
  leadCount: number
  createdAt: string
  updatedAt: string
}

interface LeadType {
  id: string
  firstName: string
  lastName: string | null
  phone: string
  email: string | null
  channel: string
  source: string | null
  pipelineStageId: string
  planInterest: string | null
  currentCoverage: string | null
  familyGroup: string | null
  status: string
  priority: string
  responseStatus: string
  lastContact: string | null
  nextFollowUp: string | null
  followUpCount: number
  finalResult: string | null
  notes: string | null
  pipelineStage: PipelineStageType
  createdAt: string
  updatedAt: string
}

// ============================================
// API HOOKS
// ============================================

function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async (): Promise<PipelineStageType[]> => {
      const res = await fetch('/api/pipeline-stages')
      if (!res.ok) throw new Error('Error loading pipeline stages')
      return res.json()
    },
  })
}

function useLeads(search?: string, priority?: string, channel?: string) {
  return useQuery({
    queryKey: ['leads', search, priority, channel],
    queryFn: async (): Promise<LeadType[]> => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (priority) params.set('priority', priority)
      if (channel) params.set('channel', channel)
      const qs = params.toString()
      const res = await fetch(`/api/leads${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Error loading leads')
      return res.json()
    },
  })
}

function useMoveLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, pipelineStageId }: { leadId: string; pipelineStageId: string }) => {
      const res = await fetch(`/api/leads/${leadId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStageId }),
      })
      if (!res.ok) throw new Error('Error moving lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
    },
  })
}

function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creating lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
    },
  })
}

// ============================================
// LEAD CARD COMPONENT (Sortable)
// ============================================

function LeadCard({ lead, isDragging }: { lead: LeadType; isDragging?: boolean }) {
  const { setSelectedLeadId, setLeadDrawerOpen } = useCRMStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  }

  const fullName = `${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}`
  const followUpOverdue = lead.nextFollowUp && isOverdue(lead.nextFollowUp)
  const whatsappLink = getWhatsAppLink(lead.phone)

  const handleClick = (e: React.MouseEvent) => {
    // Don't open detail if clicking WhatsApp link
    if ((e.target as HTMLElement).closest('a')) return
    setSelectedLeadId(lead.id)
    setLeadDrawerOpen(true)
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging || isSortableDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`
        group relative rounded-lg border bg-white p-3 shadow-sm
        cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-emerald-200
        transition-all duration-200
        ${followUpOverdue ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}
      `}
    >
      {/* Top row: Name + Priority */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {fullName}
        </h4>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 shrink-0 ${getPriorityColor(lead.priority)}`}
        >
          {getPriorityLabel(lead.priority)}
        </Badge>
      </div>

      {/* Phone with WhatsApp icon */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-xs text-gray-600 truncate">{lead.phone}</span>
      </div>

      {/* Plan interest */}
      {lead.planInterest && (
        <div className="text-xs text-gray-500 mb-1.5 truncate">
          🏥 {lead.planInterest}
        </div>
      )}

      {/* Response status + Channel */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs" title={lead.responseStatus}>
          {getResponseStatusIcon(lead.responseStatus)}
        </span>
        <span className="text-xs" title={getChannelLabel(lead.channel)}>
          {getChannelIcon(lead.channel)}
        </span>
        <span className="text-xs text-gray-400">{getChannelLabel(lead.channel)}</span>
      </div>

      {/* Last contact */}
      {lead.lastContact && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <Clock className="size-3" />
          <span>{timeAgo(lead.lastContact)}</span>
        </div>
      )}

      {/* Next follow-up */}
      {lead.nextFollowUp && (
        <div
          className={`flex items-center gap-1 text-xs ${
            followUpOverdue ? 'text-red-600 font-medium' : 'text-gray-400'
          }`}
        >
          <CalendarClock className="size-3" />
          <span>{formatFollowUp(lead.nextFollowUp)}</span>
        </div>
      )}

      {/* WhatsApp quick action */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white"
        title="Enviar WhatsApp"
      >
        <MessageCircle className="size-3.5" />
      </a>
    </motion.div>
  )
}

// ============================================
// DRAG OVERLAY CARD
// ============================================

function DragOverlayCard({ lead }: { lead: LeadType }) {
  const fullName = `${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}`
  return (
    <div className="rounded-lg border-2 border-emerald-400 bg-white p-3 shadow-xl w-[280px] rotate-2">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h4>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getPriorityColor(lead.priority)}`}>
          {getPriorityLabel(lead.priority)}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <MessageCircle className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-xs text-gray-600">{lead.phone}</span>
      </div>
      {lead.planInterest && (
        <div className="text-xs text-gray-500">🏥 {lead.planInterest}</div>
      )}
    </div>
  )
}

// ============================================
// PIPELINE COLUMN
// ============================================

function PipelineColumn({
  stage,
  leads,
  onAddLead,
}: {
  stage: PipelineStageType
  leads: LeadType[]
  onAddLead: (stageId: string) => void
}) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: stage.id,
    data: {
      type: 'column',
      stage,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col shrink-0 w-[300px] min-w-[280px] max-w-[320px]
        rounded-xl border bg-gray-50/80
        transition-all duration-200
        ${isOver ? 'ring-2 ring-emerald-400 ring-offset-1 bg-emerald-50/30' : ''}
      `}
    >
      {/* Column Header */}
      <div
        className="rounded-t-xl px-4 py-3 flex items-center justify-between gap-2"
        style={{ backgroundColor: stage.color + '18', borderBottom: `3px solid ${stage.color}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-sm font-bold truncate" style={{ color: stage.color }}>
                {stage.name}
              </h3>
            </TooltipTrigger>
            {stage.objective && (
              <TooltipContent side="bottom" className="max-w-[220px]">
                <p className="font-medium text-xs mb-1">Objetivo</p>
                <p className="text-xs opacity-90">{stage.objective}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        <Badge
          variant="secondary"
          className="text-xs font-bold shrink-0"
          style={{ backgroundColor: stage.color + '20', color: stage.color }}
        >
          {leads.length}
        </Badge>
      </div>

      {/* Cards Area */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2 min-h-[100px]">
          <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </AnimatePresence>
          </SortableContext>

          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Users className="size-8 mb-2 opacity-40" />
              <p className="text-xs">Sin leads</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Lead Button */}
      <div className="p-2 border-t border-gray-200/60">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-gray-500 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={() => onAddLead(stage.id)}
        >
          <Plus className="size-3.5 mr-1" />
          Agregar lead
        </Button>
      </div>
    </div>
  )
}

// ============================================
// NEW LEAD DIALOG
// ============================================

function NewLeadDialog({
  stages,
  defaultStageId,
  open,
  onOpenChange,
}: {
  stages: PipelineStageType[]
  defaultStageId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createLead = useCreateLead()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [planInterest, setPlanInterest] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [priority, setPriority] = useState('medium')
  const [selectedStageId, setSelectedStageId] = useState(defaultStageId || stages[0]?.id || '')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !phone.trim()) return

    await createLead.mutateAsync({
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      phone: phone.trim(),
      email: email.trim() || null,
      planInterest: planInterest.trim() || null,
      channel,
      priority,
      pipelineStageId: selectedStageId,
      notes: notes.trim() || null,
    })

    // Reset form
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setPlanInterest('')
    setChannel('whatsapp')
    setPriority('medium')
    setNotes('')
    onOpenChange(false)
  }

  // Reset stage when defaultStageId changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && defaultStageId) {
      setSelectedStageId(defaultStageId)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-emerald-600" />
            Nuevo Lead
          </DialogTitle>
          <DialogDescription>
            Agrega un nuevo lead al pipeline. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono WhatsApp *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1130000000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="planInterest">Plan de interés</Label>
              <Input
                id="planInterest"
                value={planInterest}
                onChange={(e) => setPlanInterest(e.target.value)}
                placeholder="Plan 2100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pipelineStage">Etapa</Label>
              <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="channel">Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                  <SelectItem value="facebook">👍 Facebook</SelectItem>
                  <SelectItem value="google">🔍 Google</SelectItem>
                  <SelectItem value="referido">🤝 Referido</SelectItem>
                  <SelectItem value="otro">📱 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Media</SelectItem>
                  <SelectItem value="low">🟢 Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre el lead..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createLead.isPending || !firstName.trim() || !phone.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createLead.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-1" />
                  Crear Lead
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// QUICK STATS BAR
// ============================================

function QuickStats({ leads }: { leads: LeadType[] }) {
  const totalLeads = leads.length
  const leadsToday = leads.filter((l) => {
    const d = new Date(l.createdAt)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }).length
  const overdueFollowUps = leads.filter(
    (l) => l.nextFollowUp && isOverdue(l.nextFollowUp)
  ).length

  const stats = [
    {
      label: 'Total Leads',
      value: totalLeads,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Nuevos hoy',
      value: leadsToday,
      icon: UserPlus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Seguimientos vencidos',
      value: overdueFollowUps,
      icon: AlertTriangle,
      color: overdueFollowUps > 0 ? 'text-red-600' : 'text-gray-500',
      bg: overdueFollowUps > 0 ? 'bg-red-50' : 'bg-gray-50',
    },
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${stat.bg}`}
        >
          <stat.icon className={`size-4 ${stat.color}`} />
          <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
          <span className="text-xs text-gray-500">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// MAIN PIPELINE VIEW
// ============================================

export function PipelineView() {
  const { searchQuery, setSearchQuery } = useCRMStore()
  const [localSearch, setLocalSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('_all')
  const [channelFilter, setChannelFilter] = useState<string>('_all')
  const [activeLead, setActiveLead] = useState<LeadType | null>(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [addLeadStageId, setAddLeadStageId] = useState<string | undefined>()

  // Data fetching
  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages()
  const { data: leads = [], isLoading: leadsLoading } = useLeads(
    searchQuery || localSearch || undefined,
    priorityFilter !== '_all' ? priorityFilter : undefined,
    channelFilter !== '_all' ? channelFilter : undefined
  )
  const moveLead = useMoveLead()

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, LeadType[]> = {}
    for (const stage of stages) {
      grouped[stage.id] = []
    }
    for (const lead of leads) {
      if (grouped[lead.pipelineStageId]) {
        grouped[lead.pipelineStageId].push(lead)
      }
    }
    return grouped
  }, [stages, leads])

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const lead = leads.find((l) => l.id === active.id)
    if (lead) {
      setActiveLead(lead)
    }
  }, [leads])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could add visual feedback here
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveLead(null)
      const { active, over } = event
      if (!over) return

      const leadId = active.id as string
      let targetStageId: string | null = null

      // Check if dropped on a column
      const overStage = stages.find((s) => s.id === over.id)
      if (overStage) {
        targetStageId = overStage.id
      } else {
        // Dropped on another lead — find that lead's stage
        const overLead = leads.find((l) => l.id === over.id)
        if (overLead) {
          targetStageId = overLead.pipelineStageId
        }
      }

      if (targetStageId) {
        const currentLead = leads.find((l) => l.id === leadId)
        if (currentLead && currentLead.pipelineStageId !== targetStageId) {
          moveLead.mutate({ leadId, pipelineStageId: targetStageId })
        }
      }
    },
    [stages, leads, moveLead]
  )

  // Handle add lead
  const handleAddLead = useCallback((stageId: string) => {
    setAddLeadStageId(stageId)
    setNewLeadOpen(true)
  }, [])

  // Search handler with debounce
  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value)
      setSearchQuery(value)
    },
    [setSearchQuery]
  )

  // Loading state
  if (stagesLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Cargando pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar: Search, Filters, Actions */}
      <div className="border-b bg-white px-4 py-3 space-y-3">
        {/* Row 1: Search + New Lead */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Buscar leads por nombre, teléfono, email..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger size="sm" className="w-[130px]">
                <Filter className="size-3.5 mr-1" />
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                <SelectItem value="high">🔴 Alta</SelectItem>
                <SelectItem value="medium">🟡 Media</SelectItem>
                <SelectItem value="low">🟢 Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger size="sm" className="w-[150px]">
                <Phone className="size-3.5 mr-1" />
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                <SelectItem value="instagram">📸 Instagram</SelectItem>
                <SelectItem value="facebook">👍 Facebook</SelectItem>
                <SelectItem value="google">🔍 Google</SelectItem>
                <SelectItem value="referido">🤝 Referido</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6" />

            <Button
              onClick={() => {
                setAddLeadStageId(undefined)
                setNewLeadOpen(true)
              }}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="size-4 mr-1" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* Row 2: Quick Stats */}
        <QuickStats leads={leads} />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-4 h-full overflow-x-auto overflow-y-hidden">
            <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  leads={leadsByStage[stage.id] || []}
                  onAddLead={handleAddLead}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* New Lead Dialog */}
      <NewLeadDialog
        stages={stages}
        defaultStageId={addLeadStageId}
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
      />
    </div>
  )
}
