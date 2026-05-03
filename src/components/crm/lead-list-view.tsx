'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Search,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  MessageCircle,
  Filter,
  ChevronDown,
  Loader2,
  Phone,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react'
import { useCRMStore } from '@/store/crm-store'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  timeAgo,
  formatFollowUp,
  getWhatsAppLink,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getChannelIcon,
  getChannelLabel,
  isOverdue,
} from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { LeadCreateDialog } from './lead-create-dialog'

// ============================================
// TYPES
// ============================================

interface PipelineStage {
  id: string
  name: string
  order: number
  color: string
  leadCount: number
}

interface Lead {
  id: string
  firstName: string
  lastName: string | null
  phone: string
  email: string | null
  channel: string
  source: string | null
  pipelineStageId: string
  pipelineStage: PipelineStage & { leadCount?: number }
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
  createdAt: string
  updatedAt: string
}

// ============================================
// LEAD LIST VIEW COMPONENT
// ============================================

export function LeadListView() {
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const { setSelectedLeadId, setLeadDrawerOpen, searchQuery, setSearchQuery } = useCRMStore()

  // State
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all')
  const [channelFilter, setChannelFilter] = React.useState<string>('all')
  const [stageFilter, setStageFilter] = React.useState<string>('all')
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['leads', statusFilter, priorityFilter, channelFilter, stageFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (channelFilter !== 'all') params.set('channel', channelFilter)
      if (stageFilter !== 'all') params.set('pipelineStageId', stageFilter)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Error cargando leads')
      return res.json()
    },
  })

  // Fetch pipeline stages for filter
  const { data: stages = [] } = useQuery<PipelineStage[]>({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const res = await fetch('/api/pipeline-stages')
      if (!res.ok) throw new Error('Error cargando etapas')
      return res.json()
    },
  })

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ leadIds, field, value }: { leadIds: string[]; field: string; value: string }) => {
      const promises = leadIds.map(id =>
        fetch(`/api/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        })
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setRowSelection({})
    },
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const promises = leadIds.map(id => fetch(`/api/leads/${id}`, { method: 'DELETE' }))
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setRowSelection({})
    },
  })

  // Table columns
  const columns: ColumnDef<Lead>[] = React.useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Nombre
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const lead = row.original
        const fullName = `${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}`
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{fullName}</span>
            {lead.email && <span className="text-xs text-muted-foreground">{lead.email}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Canal',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {getChannelIcon(row.original.channel)}
          <span className="text-xs">{getChannelLabel(row.original.channel)}</span>
        </div>
      ),
      filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    },
    {
      accessorKey: 'planInterest',
      header: 'Plan Interés',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.planInterest || '—'}</span>
      ),
    },
    {
      accessorKey: 'pipelineStageId',
      header: 'Etapa',
      cell: ({ row }) => {
        const stage = row.original.pipelineStage
        return (
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: stage.color, color: stage.color }}
          >
            {stage.name}
          </Badge>
        )
      },
      filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${getPriorityColor(row.original.priority)}`}>
          {getPriorityLabel(row.original.priority)}
        </Badge>
      ),
      filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    },
    {
      accessorKey: 'lastContact',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Último Contacto
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastContact ? timeAgo(row.original.lastContact) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'nextFollowUp',
      header: 'Próx. Seguimiento',
      cell: ({ row }) => {
        const followUp = row.original.nextFollowUp
        if (!followUp) return <span className="text-xs text-muted-foreground">—</span>
        const overdue = isOverdue(followUp)
        return (
          <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {formatFollowUp(followUp)}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              asChild
            >
              <a href={getWhatsAppLink(lead.phone)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              asChild
            >
              <a href={`tel:${lead.phone}`}>
                <Phone className="size-4" />
              </a>
            </Button>
          </div>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
  })

  const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key])
  const selectedLeadIds = selectedIds.map(idx => leads[parseInt(idx)]?.id).filter(Boolean)

  const handleRowClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
    setLeadDrawerOpen(true)
  }

  // ============================================
  // MOBILE CARD VIEW
  // ============================================
  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leads</h2>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4 mr-1" />
            Nuevo
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters - compact for mobile */}
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-auto min-w-[100px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="won">Ganado</SelectItem>
              <SelectItem value="lost">Perdido</SelectItem>
              <SelectItem value="paused">En pausa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger size="sm" className="w-auto min-w-[100px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-sm font-medium text-emerald-800">{selectedLeadIds.length} seleccionado(s)</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  Acciones <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'priority', value: 'high' })}>
                  Prioridad Alta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'priority', value: 'medium' })}>
                  Prioridad Media
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'priority', value: 'low' })}>
                  Prioridad Baja
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => bulkDeleteMutation.mutate(selectedLeadIds)}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Card list */}
        {leadsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-emerald-600" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No se encontraron leads</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: lead.pipelineStage.color }}
                onClick={() => handleRowClick(lead)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {lead.firstName}{lead.lastName ? ' ' + lead.lastName : ''}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPriorityColor(lead.priority)}`}>
                          {getPriorityLabel(lead.priority)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {getChannelIcon(lead.channel)}
                        <span className="text-xs text-muted-foreground">{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: lead.pipelineStage.color, color: lead.pipelineStage.color }}>
                          {lead.pipelineStage.name}
                        </Badge>
                        {lead.planInterest && (
                          <span className="text-xs text-muted-foreground">{lead.planInterest}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{lead.lastContact ? timeAgo(lead.lastContact) : '—'}</span>
                        {lead.nextFollowUp && (
                          <span className={isOverdue(lead.nextFollowUp) ? 'text-red-600 font-medium' : ''}>
                            Seg: {formatFollowUp(lead.nextFollowUp)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={getWhatsAppLink(lead.phone)} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <LeadCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    )
  }

  // ============================================
  // DESKTOP TABLE VIEW
  // ============================================
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Leads</h2>
          <p className="text-sm text-muted-foreground">{leads.length} leads encontrados</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="size-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="won">Ganado</SelectItem>
            <SelectItem value="lost">Perdido</SelectItem>
            <SelectItem value="paused">En pausa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="referido">Referido</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedLeadIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="text-sm font-medium text-emerald-800">
            {selectedLeadIds.length} lead(s) seleccionado(s)
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Cambiar etapa <ChevronDown className="size-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {stages.map((stage) => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'pipelineStageId', value: stage.id })}
                >
                  <ArrowRightLeft className="size-3.5 mr-2" />
                  {stage.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Prioridad <ChevronDown className="size-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'priority', value: 'high' })}>
                Alta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'priority', value: 'medium' })}>
                Media
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate({ leadIds: selectedLeadIds, field: 'priority', value: 'low' })}>
                Baja
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
            onClick={() => bulkDeleteMutation.mutate(selectedLeadIds)}
          >
            <Trash2 className="size-3.5 mr-1" />
            Eliminar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {leadsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-muted-foreground">Cargando leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No se encontraron leads</p>
            <p className="text-sm mt-1">Ajusta los filtros o crea un nuevo lead</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-emerald-50/50"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <LeadCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
