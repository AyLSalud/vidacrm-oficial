'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCRMStore } from '@/store/crm-store'
import {
  getTaskTypeLabel,
  getTaskTypeColor,
  isOverdue,
  formatFollowUp,
  getWhatsAppLink,
} from '@/lib/format'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

interface Lead {
  id: string
  firstName: string
  lastName: string | null
  phone: string
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
  lead: Lead
}

type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue'

// ============================================
// HELPERS
// ============================================

function getDateGroup(dueDate: string | null, completed: boolean): string {
  if (completed) return 'Completadas'
  if (!dueDate) return 'Sin fecha'

  const now = new Date()
  const due = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Vencidas'
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  if (diffDays <= 6) return 'Esta semana'
  return 'Más adelante'
}

const GROUP_ORDER: Record<string, number> = {
  Vencidas: 0,
  Hoy: 1,
  Mañana: 2,
  'Esta semana': 3,
  'Más adelante': 4,
  'Sin fecha': 5,
  Completadas: 6,
}

// ============================================
// TASK CARD COMPONENT
// ============================================

function TaskCard({
  task,
  onToggleComplete,
  onLeadClick,
}: {
  task: Task
  onToggleComplete: (id: string, completed: boolean) => void
  onLeadClick: (leadId: string) => void
}) {
  const overdue = !task.completed && isOverdue(task.dueDate)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`p-3 transition-all hover:shadow-md ${
          task.completed ? 'opacity-60 bg-gray-50' : overdue ? 'border-red-200 bg-red-50/30' : 'bg-white'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id, !task.completed)}
              className={task.completed ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' : ''}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Type badge */}
              <Badge
                variant="secondary"
                className={`text-[10px] shrink-0 px-1.5 py-0 ${getTaskTypeColor(task.type)}`}
              >
                {getTaskTypeLabel(task.type)}
              </Badge>
            </div>

            {/* Footer: Lead name, date, priority */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {/* Lead name (clickable) */}
              <button
                onClick={() => onLeadClick(task.leadId)}
                className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline font-medium truncate max-w-[150px]"
              >
                {task.lead.firstName}{task.lead.lastName ? ` ${task.lead.lastName}` : ''}
              </button>

              <span className="text-gray-300">·</span>

              {/* Due date */}
              {task.dueDate && (
                <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {overdue && <AlertTriangle className="inline size-3 mr-0.5" />}
                  {formatFollowUp(task.dueDate)}
                </span>
              )}

              {/* WhatsApp quick button */}
              <a
                href={getWhatsAppLink(task.lead.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-green-600 hover:text-green-700 transition-colors"
                title="Enviar WhatsApp"
              >
                <MessageCircle className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ============================================
// ADD TASK INLINE FORM
// ============================================

function AddTaskForm({
  leads,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  leads: { id: string; firstName: string; lastName: string | null }[]
  onSubmit: (data: { leadId: string; title: string; type: string; dueDate: string }) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [leadId, setLeadId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('follow_up')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId || !title) {
      toast.error('Completá el lead y el título')
      return
    }
    onSubmit({ leadId, title, type, dueDate })
  }

  return (
    <Card className="p-4 border-emerald-200 bg-emerald-50/50">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-emerald-800">Nueva tarea</h4>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={leadId} onValueChange={setLeadId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Seleccionar lead..." />
            </SelectTrigger>
            <SelectContent>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.firstName}{lead.lastName ? ` ${lead.lastName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className="h-9 text-sm"
          />

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 text-sm">
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
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear tarea'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TasksView() {
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const { setSelectedLeadId, setLeadDrawerOpen } = useCRMStore()
  const queryClient = useQueryClient()

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter === 'pending') params.set('completed', 'false')
      else if (filter === 'completed') params.set('completed', 'true')
      else if (filter === 'overdue') params.set('overdue', 'true')

      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error('Error fetching tasks')
      return res.json()
    },
  })

  // Fetch leads for the add task form
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-minimal'],
    queryFn: async () => {
      const res = await fetch('/api/leads')
      if (!res.ok) throw new Error('Error fetching leads')
      return res.json()
    },
  })

  // Toggle task completion
  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      if (!res.ok) throw new Error('Error updating task')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['leads-minimal'] })
      toast.success(variables.completed ? 'Tarea completada' : 'Tarea reabierta')
    },
    onError: () => {
      toast.error('Error al actualizar la tarea')
    },
  })

  // Create task
  const createMutation = useMutation({
    mutationFn: async (data: { leadId: string; title: string; type: string; dueDate: string }) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creating task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Tarea creada')
      setShowAddForm(false)
    },
    onError: () => {
      toast.error('Error al crear la tarea')
    },
  })

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    for (const task of tasks) {
      const group = getDateGroup(task.dueDate, task.completed)
      if (!groups[group]) groups[group] = []
      groups[group].push(task)
    }
    // Sort tasks within each group: overdue first, then by dueDate
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return 0
      })
    }
    return groups
  }, [tasks])

  const sortedGroupNames = Object.keys(groupedTasks).sort(
    (a, b) => (GROUP_ORDER[a] ?? 99) - (GROUP_ORDER[b] ?? 99)
  )

  // Stats
  const pendingCount = tasks.filter((t) => !t.completed).length
  const completedTodayCount = tasks.filter(
    (t) => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length
  const overdueCount = tasks.filter((t) => !t.completed && isOverdue(t.dueDate)).length

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId(leadId)
    setLeadDrawerOpen(true)
  }

  // Filter buttons
  const filters: { key: TaskFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todas', icon: <CheckSquare className="size-3.5" /> },
    { key: 'pending', label: 'Pendientes', icon: <Clock className="size-3.5" /> },
    { key: 'completed', label: 'Completadas', icon: <CheckSquare className="size-3.5" /> },
    { key: 'overdue', label: 'Vencidas', icon: <AlertTriangle className="size-3.5" /> },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tareas y Seguimientos</h2>
            <p className="text-xs text-gray-500">Gestioná tus tareas y seguimientos</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="size-4 mr-1" />
            Nueva tarea
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-500" />
            <span className="text-xs text-gray-600">
              <span className="font-semibold">{pendingCount}</span> pendientes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="size-3.5 text-emerald-600" />
            <span className="text-xs text-gray-600">
              <span className="font-semibold">{completedTodayCount}</span> completadas hoy
            </span>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-red-500" />
              <span className="text-xs text-red-600 font-semibold">
                {overdueCount} vencidas
              </span>
            </div>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs ${
                filter === f.key
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : ''
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.icon}
              <span className="ml-1">{f.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        {/* Add task form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <AddTaskForm
                leads={leads}
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setShowAddForm(false)}
                isSubmitting={createMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task groups */}
        {sortedGroupNames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckSquare className="size-12 mb-3" />
            <p className="text-sm font-medium">No hay tareas</p>
            <p className="text-xs mt-1">Creá una nueva tarea para empezar</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {sortedGroupNames.map((groupName) => {
            const groupTasks = groupedTasks[groupName]
            const isCollapsed = collapsedGroups.has(groupName)

            return (
              <div key={groupName} className="mb-4">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="flex items-center gap-2 mb-2 w-full group"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-4 text-gray-400 group-hover:text-gray-600" />
                  ) : (
                    <ChevronDown className="size-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      groupName === 'Vencidas'
                        ? 'text-red-600'
                        : groupName === 'Hoy'
                        ? 'text-emerald-600'
                        : groupName === 'Completadas'
                        ? 'text-gray-400'
                        : 'text-gray-700'
                    }`}
                  >
                    {groupName}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {groupTasks.length}
                  </Badge>
                </button>

                {/* Group tasks */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {groupTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggleComplete={(id, completed) =>
                            toggleMutation.mutate({ id, completed })
                          }
                          onLeadClick={handleLeadClick}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
