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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageCircle,
  Plus,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Globe,
  QrCode,
  Link2,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { getWhatsAppLink } from '@/lib/format'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================
interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  formalText: string
  friendlyText: string
  briefText: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Lead {
  id: string
  firstName: string
  lastName: string | null
  phone: string
  planInterest: string | null
  currentCoverage: string | null
  pipelineStage?: { name: string }
}

// ============================================
// Category helpers
// ============================================
const WHATSAPP_CATEGORIES: Record<string, string> = {
  first_contact: 'Primer Contacto',
  follow_up: 'Seguimiento',
  proposal: 'Propuesta',
  closing: 'Cierre',
  reactivation: 'Reactivación',
  scheduling: 'Agendar',
}

const CATEGORY_COLORS: Record<string, string> = {
  first_contact: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  follow_up: 'bg-amber-100 text-amber-800 border-amber-200',
  proposal: 'bg-orange-100 text-orange-800 border-orange-200',
  closing: 'bg-green-100 text-green-800 border-green-200',
  reactivation: 'bg-purple-100 text-purple-800 border-purple-200',
  scheduling: 'bg-teal-100 text-teal-800 border-teal-200',
}

// ============================================
// Main Component
// ============================================
export function WhatsAppView() {
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsapp-templates', categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      params.set('isActive', 'true')
      const res = await fetch(`/api/whatsapp-templates?${params}`)
      if (!res.ok) throw new Error('Error al cargar plantillas')
      return res.json()
    },
  })

  // Fetch leads for quick send
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads-for-whatsapp'],
    queryFn: async () => {
      const res = await fetch('/api/leads?status=active')
      if (!res.ok) throw new Error('Error al cargar leads')
      return res.json()
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/whatsapp-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      toast.success('Plantilla eliminada')
    },
  })

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'all') return templates
    return templates.filter((t) => t.category === categoryFilter)
  }, [templates, categoryFilter])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
              <MessageCircle className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp - Plantillas y Envío Rápido</h1>
              <p className="text-sm text-gray-500">Gestión de plantillas y envío de mensajes</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="size-4 mr-2" />
                Nueva Plantilla
              </Button>
            </DialogTrigger>
            <CreateTemplateDialog
              onClose={() => setCreateOpen(false)}
              onSuccess={() => {
                setCreateOpen(false)
                queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
              }}
            />
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* Explanation Banner */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="size-5 text-emerald-600" />
                Niveles de Integración WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Nivel 1</Badge>
                    <span className="text-sm font-medium text-gray-700">Gratis</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Links directos wa.me, mensajes prearmados, botón flotante, carga manual de conversaciones
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="border-gray-300 text-gray-600">Nivel 2</Badge>
                    <span className="text-sm font-medium text-gray-700">Parcial</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Herramientas externas como Zapier/Make, automatizaciones básicas, notificaciones
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="border-gray-300 text-gray-600">Nivel 3</Badge>
                    <span className="text-sm font-medium text-gray-700">Completo</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    API oficial, inbox unificado, respuestas automáticas (requiere pago a Meta)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Estás en Nivel 1 - Modo Gratuito</span>
              </div>
            </CardContent>
          </Card>

          {/* Main content tabs */}
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="bg-white border">
              <TabsTrigger value="templates" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                <MessageCircle className="size-4 mr-2" />
                Plantillas
              </TabsTrigger>
              <TabsTrigger value="quick-send" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                <Send className="size-4 mr-2" />
                Envío Rápido
              </TabsTrigger>
              <TabsTrigger value="button-generator" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                <Link2 className="size-4 mr-2" />
                Generador de Botón
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-4">
              {/* Category filter */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Filtrar por categoría:</span>
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={categoryFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs' : 'h-7 text-xs'}
                  onClick={() => setCategoryFilter('all')}
                >
                  Todas
                </Button>
                {Object.entries(WHATSAPP_CATEGORIES).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={categoryFilter === key ? 'default' : 'outline'}
                    size="sm"
                    className={categoryFilter === key ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs' : 'h-7 text-xs'}
                    onClick={() => setCategoryFilter(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Template list */}
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full size-8 border-b-2 border-emerald-600" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageCircle className="size-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No hay plantillas para esta categoría</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={(t) => {
                        setEditingTemplate(t)
                        setEditOpen(true)
                      }}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Quick Send Tab */}
            <TabsContent value="quick-send" className="mt-4">
              <QuickSendSection leads={leads} templates={templates} />
            </TabsContent>

            {/* Button Generator Tab */}
            <TabsContent value="button-generator" className="mt-4">
              <ButtonGeneratorSection />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editingTemplate && (
          <EditTemplateDialog
            template={editingTemplate}
            onClose={() => {
              setEditOpen(false)
              setEditingTemplate(null)
            }}
            onSuccess={() => {
              setEditOpen(false)
              setEditingTemplate(null)
              queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })
            }}
          />
        )}
      </Dialog>
    </div>
  )
}

// ============================================
// Template Card Component
// ============================================
function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: WhatsAppTemplate
  onEdit: (t: WhatsAppTemplate) => void
  onDelete: (id: string) => void
}) {
  const [activeVariant, setActiveVariant] = useState<'formal' | 'friendly' | 'brief'>('friendly')

  const variants = {
    formal: template.formalText,
    friendly: template.friendlyText,
    brief: template.briefText,
  }

  const variantLabels = {
    formal: 'Formal',
    friendly: 'Cercana',
    brief: 'Breve',
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Variante "${label}" copiada al portapapeles`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
            <Badge className={`text-[10px] px-2 py-0 ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-800'}`}>
              {WHATSAPP_CATEGORIES[template.category] || template.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => onEdit(template)}>
              <Edit2 className="size-3.5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => onDelete(template.id)}>
              <Trash2 className="size-3.5 text-red-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Variant tabs */}
        <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as keyof typeof variants)}>
          <TabsList className="h-7 p-0 bg-gray-100">
            {(Object.keys(variants) as Array<keyof typeof variants>).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="h-7 text-[11px] px-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                {variantLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Current variant text */}
        <div className="relative bg-gray-50 rounded-lg p-3 border">
          <p className="text-sm text-gray-700 pr-8 whitespace-pre-wrap">{variants[activeVariant]}</p>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-7 p-0 hover:bg-emerald-100"
            onClick={() => handleCopy(variants[activeVariant], variantLabels[activeVariant])}
          >
            <Copy className="size-3.5 text-emerald-600" />
          </Button>
        </div>

        {/* Quick copy all */}
        <div className="flex gap-2">
          {(Object.entries(variants) as [keyof typeof variants, string][]).map(([key, text]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleCopy(text, variantLabels[key])}
            >
              <Copy className="size-3 mr-1" />
              {variantLabels[key]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Quick Send Section
// ============================================
function QuickSendSection({ leads, templates }: { leads: Lead[]; templates: WhatsAppTemplate[] }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [variant, setVariant] = useState<'formal' | 'friendly' | 'brief'>('friendly')

  const selectedLead = leads.find((l) => l.id === selectedLeadId)
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const messagePreview = useMemo(() => {
    if (!selectedTemplate || !selectedLead) return ''
    let text = ''
    if (variant === 'formal') text = selectedTemplate.formalText
    else if (variant === 'friendly') text = selectedTemplate.friendlyText
    else text = selectedTemplate.briefText

    // Replace variables
    return text
      .replace(/\{nombre\}/g, selectedLead.firstName)
      .replace(/\{apellido\}/g, selectedLead.lastName || '')
      .replace(/\{plan\}/g, selectedLead.planInterest || 'plan de salud')
      .replace(/\{cobertura\}/g, selectedLead.currentCoverage || 'sin cobertura')
  }, [selectedTemplate, selectedLead, variant])

  const waLink = selectedLead ? getWhatsAppLink(selectedLead.phone, messagePreview) : ''

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="size-5 text-emerald-600" />
          Envío Rápido de WhatsApp
        </CardTitle>
        <CardDescription>Seleccioná un lead y una plantilla para enviar un mensaje personalizado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lead selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Lead</Label>
          <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar lead..." />
            </SelectTrigger>
            <SelectContent>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.firstName} {lead.lastName} - {lead.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Plantilla</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar plantilla..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({WHATSAPP_CATEGORIES[t.category] || t.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variant selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Variante</Label>
          <div className="flex gap-2">
            {(['formal', 'friendly', 'brief'] as const).map((v) => (
              <Button
                key={v}
                variant={variant === v ? 'default' : 'outline'}
                size="sm"
                className={variant === v ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs' : 'h-8 text-xs'}
                onClick={() => setVariant(v)}
              >
                {v === 'formal' ? 'Formal' : v === 'friendly' ? 'Cercana' : 'Breve'}
              </Button>
            ))}
          </div>
        </div>

        {/* Message preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vista previa del mensaje</Label>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 min-h-[80px]">
            {messagePreview ? (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{messagePreview}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Seleccioná un lead y una plantilla para ver la vista previa</p>
            )}
          </div>
        </div>

        {/* Variable hints */}
        {selectedTemplate && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Variables disponibles:</span>
            {['{nombre}', '{apellido}', '{plan}', '{cobertura}'].map((v) => (
              <Badge key={v} variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                {v}
              </Badge>
            ))}
          </div>
        )}

        {/* Send button */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
          disabled={!selectedLeadId || !selectedTemplateId}
          onClick={() => {
            if (waLink) {
              window.open(waLink, '_blank')
              toast.success('Abriendo WhatsApp...')
            }
          }}
        >
          <MessageCircle className="size-5 mr-2" />
          Enviar por WhatsApp
          <ExternalLink className="size-3.5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================
// Button Generator Section
// ============================================
function ButtonGeneratorSection() {
  const [phoneNumber, setPhoneNumber] = useState('5491112345678')
  const [customMessage, setCustomMessage] = useState('Hola, me interesa conocer más sobre los planes de salud')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)

  const waLink = getWhatsAppLink(phoneNumber, customMessage)

  const htmlEmbedCode = `<a href="${waLink}" target="_blank" rel="noopener noreferrer"
   style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;
   border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:16px;
   box-shadow:0 2px 8px rgba(0,0,0,0.15);">
  💬 Chateá con nosotros por WhatsApp
</a>`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waLink)
    setCopiedLink(true)
    toast.success('Link copiado al portapapeles')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlEmbedCode)
    setCopiedHtml(true)
    toast.success('Código HTML copiado al portapapeles')
    setTimeout(() => setCopiedHtml(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="size-5 text-emerald-600" />
            Generador de Botón y Link WhatsApp
          </CardTitle>
          <CardDescription>Generá links y código HTML para tu sitio web o redes sociales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número de teléfono</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5491112345678"
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500">Formato: código país + número sin espacios (54911...)</p>
          </div>

          {/* Message input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mensaje pre-cargado</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escribí el mensaje que verá el contacto..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Generated link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Link2 className="size-4 text-emerald-600" />
              Link wa.me generado
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 rounded px-3 py-2 text-xs text-emerald-700 break-all border">
                {waLink}
              </code>
              <Button variant="outline" size="sm" className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleCopyLink}>
                {copiedLink ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {/* HTML embed code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="size-4 text-emerald-600" />
              Código HTML para sitio web
            </Label>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto max-h-48 border">
                {htmlEmbedCode}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={handleCopyHtml}
              >
                {copiedHtml ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vista previa</Label>
            <div className="bg-white border rounded-lg p-4 flex items-center justify-center">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium text-sm shadow-md hover:bg-[#1da851] transition-colors"
              >
                💬 Chateá con nosotros por WhatsApp
              </a>
            </div>
          </div>

          {/* QR hint */}
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex items-start gap-3 py-4">
              <QrCode className="size-8 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Código QR</p>
                <p className="text-xs text-gray-500 mt-1">
                  Copiá el link wa.me y generá un código QR gratis en{' '}
                  <a href="https://www.qr-code-generator.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                    qr-code-generator.com
                  </a>{' '}
                  o{' '}
                  <a href="https://www.the-qrcode-generator.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                    the-qrcode-generator.com
                  </a>
                  . Ideal para tarjetas personales, flyers y materiales impresos.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Create Template Dialog
// ============================================
function CreateTemplateDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('first_contact')
  const [formalText, setFormalText] = useState('')
  const [friendlyText, setFriendlyText] = useState('')
  const [briefText, setBriefText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !formalText || !friendlyText || !briefText) {
      toast.error('Completá todos los campos requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, formalText, friendlyText, briefText }),
      })
      if (!res.ok) throw new Error('Error al crear')
      toast.success('Plantilla creada exitosamente')
      onSuccess()
    } catch {
      toast.error('Error al crear la plantilla')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Nueva Plantilla WhatsApp</DialogTitle>
        <DialogDescription>Creá una plantilla con 3 variantes: formal, cercana y breve</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Primer Contacto" />
          </div>
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WHATSAPP_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texto Formal *</Label>
          <Textarea value={formalText} onChange={(e) => setFormalText(e.target.value)} rows={3} placeholder="Versión formal del mensaje..." />
        </div>

        <div className="space-y-2">
          <Label>Texto Cercana *</Label>
          <Textarea value={friendlyText} onChange={(e) => setFriendlyText(e.target.value)} rows={3} placeholder="Versión amigable del mensaje..." />
        </div>

        <div className="space-y-2">
          <Label>Texto Breve *</Label>
          <Textarea value={briefText} onChange={(e) => setBriefText(e.target.value)} rows={2} placeholder="Versión corta del mensaje..." />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Variables disponibles:</span>
          {['{nombre}', '{apellido}', '{plan}', '{cobertura}'].map((v) => (
            <Badge key={v} variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
              {v}
            </Badge>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Crear Plantilla'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ============================================
// Edit Template Dialog
// ============================================
function EditTemplateDialog({
  template,
  onClose,
  onSuccess,
}: {
  template: WhatsAppTemplate
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(template.name)
  const [category, setCategory] = useState(template.category)
  const [formalText, setFormalText] = useState(template.formalText)
  const [friendlyText, setFriendlyText] = useState(template.friendlyText)
  const [briefText, setBriefText] = useState(template.briefText)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !formalText || !friendlyText || !briefText) {
      toast.error('Completá todos los campos requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/whatsapp-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, formalText, friendlyText, briefText }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      toast.success('Plantilla actualizada')
      onSuccess()
    } catch {
      toast.error('Error al actualizar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Editar Plantilla</DialogTitle>
        <DialogDescription>Modificá las variantes de la plantilla</DialogDescription>
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
                {Object.entries(WHATSAPP_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texto Formal *</Label>
          <Textarea value={formalText} onChange={(e) => setFormalText(e.target.value)} rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Texto Cercana *</Label>
          <Textarea value={friendlyText} onChange={(e) => setFriendlyText(e.target.value)} rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Texto Breve *</Label>
          <Textarea value={briefText} onChange={(e) => setBriefText(e.target.value)} rows={2} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Variables:</span>
          {['{nombre}', '{apellido}', '{plan}', '{cobertura}'].map((v) => (
            <Badge key={v} variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
              {v}
            </Badge>
          ))}
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
