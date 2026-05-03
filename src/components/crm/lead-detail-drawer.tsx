'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle,
  Phone,
  Mail,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  StickyNote,
  Loader2,
  Send,
  X,
  Shield,
  Users,
  FileText,
} from 'lucide-react'
import { useCRMStore } from '@/store/crm-store'
import {
  timeAgo,
  formatDateTime,
  formatDate,
  formatFollowUp,
  getWhatsAppLink,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getChannelIcon,
  getChannelLabel,
  getInteractionIcon,
  getInteractionColor,
  getInteractionLabel,
  getTaskTypeLabel,
  getTaskTypeColor,
  isOverdue,
} from '@/lib/format'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LeadEditForm } from './lead-edit-form'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

interface PipelineStage {
  id: string
  name: string
  order: number
  color: string
  leadCount?: number
}

interface Task {
  id: string
  leadId: string
  title: string
  description: string | null
  type: string
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Interaction {
  id: string
  leadId: string
  type: string
  content: string
  metadata: string | null
  createdAt: string
}

interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  formalText: string
  friendlyText: string
  briefText: string
  isActive: boolean
}

interface LeadDetail {
  id: string
  firstName: string
  lastName: string | null
  phone: string
  email: string | null
  channel: string
  source: string | null
  pipelineStageId: string
  pipelineStage: PipelineStage
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
  tasks: Task[]
  interactions: Interaction[]
  createdAt: string
  updatedAt: string
}

// ============================================
// LEAD DETAIL DRAWER
// ============================================

export function LeadDetailDrawer() {
  const queryClient = useQueryClient()
  const { selectedLeadId, leadDrawerOpen, setLeadDrawerOpen, setSelectedLeadId } = useCRMStore()
  const [editMode, setEditMode] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const [newTaskType, setNewTaskType] = React.useState('follow_up')
  const [newTaskDue, setNewTaskDue] = React.useState('')
  const [showAddTask, setShowAddTask] = React.useState(false)
  const [newNote, setNewNote] = React.useState('')
  const [showAddNote, setShowAddNote] = React.useState(false)
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('')
  const [templateVariant, setTemplateVariant] = React.useState<'formal' | 'friendly' | 'brief'>('friendly')

  // Fetch lead detail
  const { data: lead, isLoading } = useQuery<LeadDetail>({
    queryKey: ['lead', selectedLeadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${selectedLeadId}`)
      if (!res.ok) throw new Error('Error cargando lead')
      return res.json()
    },
    enabled: !!selectedLeadId && leadDrawerOpen,
  })

  // Fetch pipeline stages
  const { data: stages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const res = await fetch('/api/pipeline-stages')
      if (!res.ok) throw new Error('Error cargando etapas')
      return res.json()
    },
    enabled: leadDrawerOpen,
  })

  // Fetch WhatsApp templates
  const { data: templates = [] } = useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp-templates?isActive=true')
      if (!res.ok) throw new Error('Error cargando plantillas')
      return res.json()
    },
    enabled: leadDrawerOpen,
  })

  // Move lead mutation
  const moveMutation = useMutation({
    mutationFn: async ({ leadId, pipelineStageId }: { leadId: string; pipelineStageId: string }) => {
      const res = await fetch(`/api/leads/${leadId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStageId }),
      })
      if (!res.ok) throw new Error('Error moviendo lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Etapa actualizada')
    },
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: { leadId: string; title: string; type: string; dueDate?: string }) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creando tarea')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setNewTaskTitle('')
      setNewTaskType('follow_up')
      setNewTaskDue('')
      setShowAddTask(false)
      toast.success('Tarea creada')
    },
  })

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      if (!res.ok) throw new Error('Error actualizando tarea')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
      toast.success('Tarea actualizada')
    },
  })

  // Create interaction mutation
  const createInteractionMutation = useMutation({
    mutationFn: async (data: { leadId: string; type: string; content: string; metadata?: string }) => {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creando interacción')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setNewNote('')
      setShowAddNote(false)
      toast.success('Nota agregada')
    },
  })

  // Handle close
  const handleClose = () => {
    setLeadDrawerOpen(false)
    setEditMode(false)
    setShowAddTask(false)
    setShowAddNote(false)
    setNewNote('')
    setNewTaskTitle('')
  }

  // Navigation helpers
  const currentStageIndex = stages.findIndex(s => s.id === lead?.pipelineStageId)
  const prevStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : null
  const nextStage = currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null

  // Template preview
  const getTemplateText = () => {
    const tpl = templates.find(t => t.id === selectedTemplate)
    if (!tpl || !lead) return ''
    let text = ''
    switch (templateVariant) {
      case 'formal': text = tpl.formalText; break
      case 'friendly': text = tpl.friendlyText; break
      case 'brief': text = tpl.briefText; break
    }
    // Replace variables
    const fullName = `${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}`
    text = text.replace(/\{nombre\}/g, lead.firstName)
    text = text.replace(/\{apellido\}/g, lead.lastName || '')
    text = text.replace(/\{nombre_completo\}/g, fullName)
    text = text.replace(/\{plan\}/g, lead.planInterest || '')
    text = text.replace(/\{cobertura\}/g, lead.currentCoverage || '')
    return text
  }

  return (
    <Sheet open={leadDrawerOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-emerald-600" />
          </div>
        ) : !lead ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Lead no encontrado
          </div>
        ) : editMode ? (
          <div className="h-full flex flex-col">
            <SheetHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle>Editar Lead</SheetTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                  <X className="size-4 mr-1" />
                  Cancelar
                </Button>
              </div>
              <SheetDescription>Modifica los datos del lead</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <LeadEditForm
                  lead={lead}
                  onSuccess={() => {
                    setEditMode(false)
                    queryClient.invalidateQueries({ queryKey: ['lead', selectedLeadId] })
                    queryClient.invalidateQueries({ queryKey: ['leads'] })
                  }}
                  onCancel={() => setEditMode(false)}
                />
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Header */}
            <SheetHeader className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl">
                    {lead.firstName}{lead.lastName ? ' ' + lead.lastName : ''}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    <span className="font-mono">{lead.phone}</span>
                    {lead.email && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span>{lead.email}</span>
                      </>
                    )}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                    asChild
                  >
                    <a href={getWhatsAppLink(lead.phone)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    asChild
                  >
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="size-4" />
                    </a>
                  </Button>
                  {lead.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                      asChild
                    >
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="size-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => setEditMode(true)}
                  >
                    <Edit3 className="size-4" />
                  </Button>
                </div>
              </div>
              {/* Status and priority badges */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getStatusColor(lead.status)}>
                  {getStatusLabel(lead.status)}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(lead.priority)}>
                  {getPriorityLabel(lead.priority)}
                </Badge>
                <div className="flex items-center gap-1.5 ml-auto">
                  {getChannelIcon(lead.channel)}
                  <span className="text-xs text-muted-foreground">{getChannelLabel(lead.channel)}</span>
                </div>
              </div>
            </SheetHeader>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Pipeline Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="size-4 text-emerald-600" />
                    Pipeline
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    {stages.map((stage, idx) => (
                      <React.Fragment key={stage.id}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`size-3 rounded-full transition-all ${
                              idx === currentStageIndex
                                ? 'ring-2 ring-offset-2 ring-emerald-500 scale-125'
                                : idx < currentStageIndex
                                ? 'bg-emerald-400'
                                : 'bg-gray-200'
                            }`}
                            style={idx === currentStageIndex ? { backgroundColor: stage.color } : idx < currentStageIndex ? { backgroundColor: stage.color, opacity: 0.6 } : undefined}
                            title={stage.name}
                          />
                          <span className={`text-[9px] mt-1 max-w-[60px] text-center leading-tight ${
                            idx === currentStageIndex ? 'font-medium text-foreground' : 'text-muted-foreground'
                          }`}>
                            {stage.name}
                          </span>
                        </div>
                        {idx < stages.length - 1 && (
                          <div className={`h-0.5 flex-1 min-w-[12px] mt-[-12px] ${
                            idx < currentStageIndex ? 'bg-emerald-300' : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!prevStage}
                      onClick={() => moveMutation.mutate({ leadId: lead.id, pipelineStageId: prevStage!.id })}
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      {prevStage?.name || 'Anterior'}
                    </Button>
                    <Badge
                      variant="outline"
                      className="text-xs px-3 py-1"
                      style={{ borderColor: lead.pipelineStage.color, color: lead.pipelineStage.color }}
                    >
                      {lead.pipelineStage.name}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!nextStage}
                      onClick={() => moveMutation.mutate({ leadId: lead.id, pipelineStageId: nextStage!.id })}
                    >
                      {nextStage?.name || 'Siguiente'}
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Product Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="size-4 text-emerald-600" />
                    Producto y Cobertura
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground">Plan de interés</span>
                      <p className="text-sm font-medium mt-0.5">{lead.planInterest || '—'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground">Cobertura actual</span>
                      <p className="text-sm font-medium mt-0.5">{lead.currentCoverage || '—'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="size-3" /> Grupo familiar
                      </span>
                      <p className="text-sm font-medium mt-0.5">{lead.familyGroup || '—'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <span className="text-xs text-muted-foreground">Último contacto</span>
                      <p className="text-sm font-medium mt-0.5">{lead.lastContact ? timeAgo(lead.lastContact) : '—'}</p>
                    </div>
                  </div>
                  {lead.notes && (
                    <div className="rounded-lg border p-3 mt-3">
                      <span className="text-xs text-muted-foreground">Observaciones</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                  {lead.nextFollowUp && (
                    <div className={`rounded-lg border p-3 mt-3 ${isOverdue(lead.nextFollowUp) ? 'border-red-200 bg-red-50' : ''}`}>
                      <span className="text-xs text-muted-foreground">Próximo seguimiento</span>
                      <p className={`text-sm font-medium mt-0.5 ${isOverdue(lead.nextFollowUp) ? 'text-red-700' : ''}`}>
                        {formatFollowUp(lead.nextFollowUp)}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Tasks Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="size-4 text-emerald-600" />
                      Tareas ({lead.tasks.filter(t => !t.completed).length} pendientes)
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600 hover:text-emerald-700"
                      onClick={() => setShowAddTask(!showAddTask)}
                    >
                      <Plus className="size-3.5 mr-1" />
                      Agregar
                    </Button>
                  </div>

                  {/* Add task inline form */}
                  {showAddTask && (
                    <Card className="mb-3 border-emerald-200 bg-emerald-50/50">
                      <CardContent className="p-3">
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Título de la tarea"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Select value={newTaskType} onValueChange={setNewTaskType}>
                              <SelectTrigger className="w-[150px]" size="sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="follow_up">Seguimiento</SelectItem>
                                <SelectItem value="call">Llamada</SelectItem>
                                <SelectItem value="meeting">Reunión</SelectItem>
                                <SelectItem value="send_proposal">Enviar propuesta</SelectItem>
                                <SelectItem value="send_info">Enviar info</SelectItem>
                                <SelectItem value="reminder">Recordatorio</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={newTaskDue}
                              onChange={(e) => setNewTaskDue(e.target.value)}
                              className="w-auto"
                              size={undefined}
                            />
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 ml-auto"
                              disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                              onClick={() => {
                                createTaskMutation.mutate({
                                  leadId: lead.id,
                                  title: newTaskTitle,
                                  type: newTaskType,
                                  dueDate: newTaskDue || undefined,
                                })
                              }}
                            >
                              {createTaskMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tasks list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {lead.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin tareas</p>
                    ) : (
                      lead.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                            task.completed ? 'bg-gray-50 opacity-60' : isOverdue(task.dueDate) ? 'bg-red-50 border-red-200' : 'bg-card'
                          }`}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) =>
                              completeTaskMutation.mutate({ taskId: task.id, completed: !!checked })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTaskTypeColor(task.type)}`}>
                                {getTaskTypeLabel(task.type)}
                              </Badge>
                              {task.dueDate && (
                                <span className={`text-[10px] ${isOverdue(task.dueDate) && !task.completed ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                {/* Interaction History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <StickyNote className="size-4 text-emerald-600" />
                      Historial ({lead.interactions.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600 hover:text-emerald-700"
                      onClick={() => setShowAddNote(!showAddNote)}
                    >
                      <Plus className="size-3.5 mr-1" />
                      Nota
                    </Button>
                  </div>

                  {/* Add note inline form */}
                  {showAddNote && (
                    <Card className="mb-3 border-emerald-200 bg-emerald-50/50">
                      <CardContent className="p-3">
                        <Textarea
                          placeholder="Escribir nota..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button variant="ghost" size="sm" onClick={() => setShowAddNote(false)}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={!newNote.trim() || createInteractionMutation.isPending}
                            onClick={() => {
                              createInteractionMutation.mutate({
                                leadId: lead.id,
                                type: 'note',
                                content: newNote,
                              })
                            }}
                          >
                            {createInteractionMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Guardar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Timeline */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {lead.interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin interacciones</p>
                    ) : (
                      lead.interactions.map((interaction) => (
                        <div
                          key={interaction.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${getInteractionColor(interaction.type)}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/60">
                                {getInteractionLabel(interaction.type)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateTime(interaction.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{interaction.content}</p>
                            {interaction.metadata && (
                              (() => {
                                try {
                                  const meta = JSON.parse(interaction.metadata)
                                  if (meta.fromStageName && meta.toStageName) {
                                    return (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {meta.fromStageName} → {meta.toStageName}
                                      </p>
                                    )
                                  }
                                } catch { /* ignore */ }
                                return null
                              })()
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                {/* Quick WhatsApp Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="size-4 text-green-600" />
                    WhatsApp Rápido
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((tpl) => (
                            <SelectItem key={tpl.id} value={tpl.id}>
                              {tpl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedTemplate && (
                      <>
                        <Tabs value={templateVariant} onValueChange={(v) => setTemplateVariant(v as 'formal' | 'friendly' | 'brief')}>
                          <TabsList className="w-full">
                            <TabsTrigger value="formal" className="flex-1 text-xs">Formal</TabsTrigger>
                            <TabsTrigger value="friendly" className="flex-1 text-xs">Cercana</TabsTrigger>
                            <TabsTrigger value="brief" className="flex-1 text-xs">Breve</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <div className="rounded-lg border bg-green-50 p-3">
                          <p className="text-sm whitespace-pre-wrap">{getTemplateText()}</p>
                        </div>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          asChild
                          onClick={() => {
                            // Log the interaction
                            createInteractionMutation.mutate({
                              leadId: lead.id,
                              type: 'whatsapp_sent',
                              content: `WhatsApp enviado (plantilla: ${templates.find(t => t.id === selectedTemplate)?.name || selectedTemplate}, variante: ${templateVariant})`,
                              metadata: JSON.stringify({ templateId: selectedTemplate, variant: templateVariant }),
                            })
                          }}
                        >
                          <a
                            href={getWhatsAppLink(lead.phone, getTemplateText())}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 no-underline text-inherit"
                          >
                            <Send className="size-4" />
                            Enviar por WhatsApp
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer info */}
                <div className="text-xs text-muted-foreground pt-2">
                  <p>Creado: {formatDateTime(lead.createdAt)}</p>
                  <p>Actualizado: {formatDateTime(lead.updatedAt)}</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
