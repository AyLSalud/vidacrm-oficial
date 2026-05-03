'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sparkles,
  Plus,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Info,
  Brain,
  BarChart3,
  Reply,
  Filter,
  RefreshCw,
  Target,
  Variable,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================
interface AIPrompt {
  id: string
  name: string
  category: string
  promptText: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================
// Category helpers
// ============================================
const AI_CATEGORIES: Record<string, string> = {
  analysis: 'Análisis',
  follow_up: 'Seguimiento',
  classification: 'Clasificación',
  reactivation: 'Reactivación',
  daily_priority: 'Prioridad Diaria',
}

const CATEGORY_COLORS: Record<string, string> = {
  analysis: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  follow_up: 'bg-amber-100 text-amber-800 border-amber-200',
  classification: 'bg-purple-100 text-purple-800 border-purple-200',
  reactivation: 'bg-orange-100 text-orange-800 border-orange-200',
  daily_priority: 'bg-red-100 text-red-800 border-red-200',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  analysis: <BarChart3 className="size-4" />,
  follow_up: <Reply className="size-4" />,
  classification: <Filter className="size-4" />,
  reactivation: <RefreshCw className="size-4" />,
  daily_priority: <Target className="size-4" />,
}

// ============================================
// Main Component
// ============================================
export function AIAssistantView() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Fetch prompts
  const { data: prompts = [], isLoading } = useQuery<AIPrompt[]>({
    queryKey: ['ai-prompts'],
    queryFn: async () => {
      const res = await fetch('/api/ai-prompts')
      if (!res.ok) throw new Error('Error al cargar prompts')
      return res.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai-prompts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompts'] })
      toast.success('Prompt eliminado')
    },
  })

  // Group prompts by category
  const promptsByCategory = useMemo(() => {
    const grouped: Record<string, AIPrompt[]> = {}
    prompts.forEach((p) => {
      if (!grouped[p.category]) grouped[p.category] = []
      grouped[p.category].push(p)
    })
    return grouped
  }, [prompts])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Asistente IA - Prompts para Ventas</h1>
              <p className="text-sm text-gray-500">Prompts optimizados para usar con IA en tu proceso de ventas</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="size-4 mr-2" />
                Nuevo Prompt
              </Button>
            </DialogTrigger>
            <CreatePromptDialog
              onClose={() => setCreateOpen(false)}
              onSuccess={() => {
                setCreateOpen(false)
                queryClient.invalidateQueries({ queryKey: ['ai-prompts'] })
              }}
            />
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
          {/* Explanation Banner */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="size-5 text-emerald-600" />
                Cómo usar estos prompts con IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-700">
                Estos prompts están diseñados para usar con herramientas de IA como <strong>Z.AI</strong>, ChatGPT, o Claude.
                Copiá el prompt, reemplazá las variables entre llaves <code className="bg-white px-1 rounded border">{'{variable}'}</code> con los datos reales, y pegalo en tu herramienta de IA favorita.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Brain className="size-4 text-emerald-600" />
                  <span>Copiar prompt → Pegar en IA → Obtener resultado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt categories tabs */}
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="bg-white border flex-wrap h-auto p-1 gap-1">
              {Object.entries(AI_CATEGORIES).map(([key, label]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 text-xs"
                >
                  {CATEGORY_ICONS[key]}
                  <span className="ml-1.5">{label}</span>
                  {promptsByCategory[key] && (
                    <Badge variant="outline" className="ml-1.5 h-4 px-1.5 text-[10px]">
                      {promptsByCategory[key].length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(AI_CATEGORIES).map(([categoryKey, categoryLabel]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full size-8 border-b-2 border-emerald-600" />
                  </div>
                ) : !promptsByCategory[categoryKey]?.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Sparkles className="size-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">No hay prompts en esta categoría</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {promptsByCategory[categoryKey].map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onEdit={(p) => {
                          setEditingPrompt(p)
                          setEditOpen(true)
                        }}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick Use Section */}
          <QuickUseSection prompts={prompts} />
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editingPrompt && (
          <EditPromptDialog
            prompt={editingPrompt}
            onClose={() => {
              setEditOpen(false)
              setEditingPrompt(null)
            }}
            onSuccess={() => {
              setEditOpen(false)
              setEditingPrompt(null)
              queryClient.invalidateQueries({ queryKey: ['ai-prompts'] })
            }}
          />
        )}
      </Dialog>
    </div>
  )
}

// ============================================
// Prompt Card Component
// ============================================
function PromptCard({
  prompt,
  onEdit,
  onDelete,
}: {
  prompt: AIPrompt
  onEdit: (p: AIPrompt) => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)

  // Extract variables from prompt text
  const variables = useMemo(() => {
    const matches = prompt.promptText.match(/\{(\w+)\}/g)
    if (!matches) return []
    return [...new Set(matches)]
  }, [prompt.promptText])

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.promptText)
    setCopied(true)
    toast.success('Prompt copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  // Highlight variables in prompt text
  const highlightedText = useMemo(() => {
    let text = prompt.promptText
    variables.forEach((v) => {
      text = text.replace(
        new RegExp(v.replace(/[{}]/g, '\\$&'), 'g'),
        `⟨${v}⟩`
      )
    })
    return text
  }, [prompt.promptText, variables])

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">{prompt.name}</CardTitle>
            <Badge className={`text-[10px] px-2 py-0 ${CATEGORY_COLORS[prompt.category] || 'bg-gray-100 text-gray-800'}`}>
              {AI_CATEGORIES[prompt.category] || prompt.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-gray-500" />}
            </Button>
            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => onEdit(prompt)}>
              <Edit2 className="size-3.5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => onDelete(prompt.id)}>
              <Trash2 className="size-3.5 text-red-400" />
            </Button>
          </div>
        </div>
        {prompt.description && (
          <CardDescription className="text-xs mt-1">{prompt.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Variables */}
        {variables.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Variable className="size-3.5 text-emerald-600" />
            <span className="text-xs text-gray-500">Variables:</span>
            {variables.map((v) => (
              <Badge key={v} variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                {v}
              </Badge>
            ))}
          </div>
        )}

        {/* Prompt text */}
        <div className="relative bg-gray-900 rounded-lg p-4 border border-gray-800">
          <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
            {highlightedText}
          </pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-7 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
            onClick={handleCopy}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Quick Use Section
// ============================================
function QuickUseSection({ prompts }: { prompts: AIPrompt[] }) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId)

  // Extract variables from selected prompt
  const variables = useMemo(() => {
    if (!selectedPrompt) return []
    const matches = selectedPrompt.promptText.match(/\{(\w+)\}/g)
    if (!matches) return []
    return [...new Set(matches)]
  }, [selectedPrompt])

  // Fill prompt with variable values
  const filledPrompt = useMemo(() => {
    if (!selectedPrompt) return ''
    let text = selectedPrompt.promptText
    Object.entries(variableValues).forEach(([key, value]) => {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`)
    })
    return text
  }, [selectedPrompt, variableValues])

  const handlePromptSelect = (id: string) => {
    setSelectedPromptId(id)
    setVariableValues({})
    setCopied(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(filledPrompt)
    setCopied(true)
    toast.success('Prompt completado copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-5 text-emerald-600" />
          Uso Rápido
        </CardTitle>
        <CardDescription>Seleccioná un prompt, completá las variables y copiá el resultado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seleccionar Prompt</Label>
          <Select value={selectedPromptId} onValueChange={handlePromptSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Elegí un prompt..." />
            </SelectTrigger>
            <SelectContent>
              {prompts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({AI_CATEGORIES[p.category] || p.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variable inputs */}
        {variables.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Variable className="size-4 text-emerald-600" />
              Completar Variables
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variables.map((v) => {
                const varName = v.replace(/[{}]/g, '')
                return (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs text-gray-600">{v}</Label>
                    {varName === 'conversacion' || varName === 'leads' ? (
                      <Textarea
                        value={variableValues[varName] || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({ ...prev, [varName]: e.target.value }))
                        }
                        placeholder={`Ingresá ${varName}...`}
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        value={variableValues[varName] || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({ ...prev, [varName]: e.target.value }))
                        }
                        placeholder={`Ingresá ${varName}...`}
                        className="text-sm"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filled prompt preview */}
        {selectedPrompt && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prompt Completado</Label>
            <div className="relative bg-gray-900 rounded-lg p-4 border border-gray-800">
              <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                {filledPrompt}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 size-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
                onClick={handleCopy}
              >
                {copied ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Copy button */}
        {selectedPrompt && (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-4 mr-2" />
                Copiado al portapapeles
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                Copiar Prompt Completado
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// Create Prompt Dialog
// ============================================
function CreatePromptDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('analysis')
  const [description, setDescription] = useState('')
  const [promptText, setPromptText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !promptText || !category) {
      toast.error('Completá los campos requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/ai-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, promptText, description }),
      })
      if (!res.ok) throw new Error('Error al crear')
      toast.success('Prompt creado exitosamente')
      onSuccess()
    } catch {
      toast.error('Error al crear el prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Nuevo Prompt IA</DialogTitle>
        <DialogDescription>Creá un prompt para asistir tu proceso de ventas</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Resumir Conversación" />
          </div>
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AI_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qué hace este prompt..." />
        </div>

        <div className="space-y-2">
          <Label>Texto del Prompt *</Label>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={6}
            placeholder="Escribí el prompt aquí. Usá {variable} para los valores dinámicos..."
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border">
          <p className="text-xs text-gray-600 mb-2 font-medium">Sintaxis de variables:</p>
          <p className="text-xs text-gray-500">
            Usá llaves para definir variables: <code className="bg-white px-1 rounded border">{'{nombre}'}</code>, <code className="bg-white px-1 rounded border">{'{conversacion}'}</code>, <code className="bg-white px-1 rounded border">{'{etapa}'}</code>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Las variables se detectan automáticamente y se generan campos de entrada para completarlas.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Crear Prompt'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ============================================
// Edit Prompt Dialog
// ============================================
function EditPromptDialog({
  prompt,
  onClose,
  onSuccess,
}: {
  prompt: AIPrompt
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(prompt.name)
  const [category, setCategory] = useState(prompt.category)
  const [description, setDescription] = useState(prompt.description || '')
  const [promptText, setPromptText] = useState(prompt.promptText)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !promptText || !category) {
      toast.error('Completá los campos requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/ai-prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, promptText, description }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      toast.success('Prompt actualizado')
      onSuccess()
    } catch {
      toast.error('Error al actualizar el prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Editar Prompt</DialogTitle>
        <DialogDescription>Modificá el prompt y sus variables</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AI_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Texto del Prompt *</Label>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={6}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
