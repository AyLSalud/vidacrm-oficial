'use client'

import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Copy,
  CheckCircle2,
  Globe,
  MessageCircle,
  QrCode,
  Instagram,
  Facebook,
  Link2,
  Smartphone,
  ExternalLink,
  Send,
  Code,
  Info,
} from 'lucide-react'
import { getWhatsAppLink } from '@/lib/format'
import { toast } from 'sonner'

// ============================================
// Main Component
// ============================================
export function FormsView() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FileText className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Formularios de Captación</h1>
            <p className="text-sm text-gray-500">Capturá leads desde tu web, redes sociales y materiales impresos</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
          {/* Explanation */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="size-5 text-emerald-600" />
                Cómo funcionan los formularios de captación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Los formularios de captación te permiten recibir consultas directamente desde tu sitio web,
                redes sociales o campañas publicitarias. Cada formulario crea automáticamente un nuevo lead en tu CRM.
                También podés usar el botón flotante de WhatsApp y códigos QR para maximizar los puntos de contacto.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Globe className="size-4 text-emerald-600 shrink-0" />
                  <span>Formulario web → Lead automático</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MessageCircle className="size-4 text-green-600 shrink-0" />
                  <span>Botón WhatsApp → Chat directo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <QrCode className="size-4 text-gray-600 shrink-0" />
                  <span>QR → Link instantáneo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Capture Form Preview */}
          <LeadCaptureFormPreview />

          {/* WhatsApp Floating Button */}
          <WhatsAppFloatingButton />

          {/* QR Code Section */}
          <QRCodeSection />

          {/* Social Media Links */}
          <SocialMediaLinks />
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Lead Capture Form Preview
// ============================================
function LeadCaptureFormPreview() {
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [planInterest, setPlanInterest] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !phone) {
      toast.error('Nombre y teléfono son obligatorios')
      return
    }
    setSubmitting(true)
    try {
      // Get the first pipeline stage (Nuevo Lead)
      const stagesRes = await fetch('/api/pipeline-stages')
      const stages = await stagesRes.json()
      const firstStage = stages[0]

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          phone,
          email: email || undefined,
          planInterest: planInterest || undefined,
          channel: 'web_form',
          pipelineStageId: firstStage?.id,
          notes: message || undefined,
        }),
      })
      if (!res.ok) throw new Error('Error al crear lead')
      toast.success('¡Lead creado exitosamente!')
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setTimeout(() => {
        setSubmitted(false)
        setFirstName('')
        setPhone('')
        setEmail('')
        setPlanInterest('')
        setMessage('')
      }, 3000)
    } catch {
      toast.error('Error al crear el lead')
    } finally {
      setSubmitting(false)
    }
  }

  const embedHtmlCode = `<!-- Formulario de Captación PlanVida CRM -->
<form id="planvida-capture-form" action="https://tu-dominio.com/api/leads" method="POST">
  <input type="text" name="firstName" placeholder="Nombre *" required />
  <input type="tel" name="phone" placeholder="Teléfono *" required />
  <input type="email" name="email" placeholder="Email" />
  <select name="planInterest">
    <option value="">Plan de interés</option>
    <option value="Plan 2100">Plan 2100</option>
    <option value="Plan 3100">Plan 3100</option>
    <option value="Plan 4100">Plan 4100</option>
  </select>
  <textarea name="notes" placeholder="Mensaje"></textarea>
  <button type="submit">Consultar Plan</button>
</form>`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedHtmlCode)
    setCopiedCode(true)
    toast.success('Código HTML copiado al portapapeles')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-5 text-emerald-600" />
            Vista Previa del Formulario
          </CardTitle>
          <CardDescription>Así verán el formulario tus visitantes</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-12 text-emerald-500 mb-3" />
              <p className="text-lg font-medium text-emerald-700">¡Consulta enviada!</p>
              <p className="text-sm text-gray-500 mt-1">El lead fue creado en tu CRM</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11 1234-5678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plan de interés</Label>
                <Select value={planInterest} onValueChange={setPlanInterest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plan 2100">Plan 2100</SelectItem>
                    <SelectItem value="Plan 3100">Plan 3100</SelectItem>
                    <SelectItem value="Plan 4100">Plan 4100</SelectItem>
                    <SelectItem value="Otro">Otro / No estoy seguro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mensaje</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Contanos qué necesitás..."
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full size-4 border-b-2 border-white" />
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Consultar Plan
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Embed code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="size-5 text-emerald-600" />
            Código para Insertar
          </CardTitle>
          <CardDescription>Copiá este código para agregar el formulario a tu sitio web</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto max-h-80 border border-gray-800">
              {embedHtmlCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={handleCopyCode}
            >
              {copiedCode ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Nota:</strong> Para uso en producción, este formulario debería integrarse como iframe
              o componente embebido. El código mostrado es de referencia y puede adaptarse a tu sitio.
              Asegurate de configurar el endpoint correcto en el atributo <code className="bg-white px-1 rounded border">action</code>.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Opciones de integración:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 shrink-0 mt-0.5">Iframe</Badge>
                <p className="text-xs text-gray-600">Insertá la página del formulario como iframe en tu sitio</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 shrink-0 mt-0.5">API</Badge>
                <p className="text-xs text-gray-600">Enviá los datos del formulario vía POST a /api/leads</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 shrink-0 mt-0.5">Zapier</Badge>
                <p className="text-xs text-gray-600">Conectá cualquier formulario web usando Zapier como intermediario</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// WhatsApp Floating Button Generator
// ============================================
function WhatsAppFloatingButton() {
  const [phoneNumber, setPhoneNumber] = useState('5491112345678')
  const [prefilledMessage, setPrefilledMessage] = useState('Hola, me interesa conocer más sobre los planes de salud')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [copiedCode, setCopiedCode] = useState(false)

  const waLink = getWhatsAppLink(phoneNumber, prefilledMessage)

  const cssPosition = position === 'bottom-right' ? 'right: 24px;' : 'left: 24px;'

  const floatingButtonCode = `<!-- Botón Flotante WhatsApp - PlanVida -->
<style>
  .whatsapp-float {
    position: fixed;
    bottom: 24px;
    ${cssPosition}
    z-index: 9999;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #25D366;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
  }
  .whatsapp-float:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0,0,0,0.3);
  }
  .whatsapp-float svg {
    width: 32px;
    height: 32px;
    fill: white;
  }
  .whatsapp-float-pulse {
    position: fixed;
    bottom: 24px;
    ${cssPosition}
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #25D366;
    z-index: 9998;
    animation: whatsapp-pulse 2s infinite;
  }
  @keyframes whatsapp-pulse {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.5); opacity: 0; }
  }
</style>
<a href="${waLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-float" aria-label="Chatear por WhatsApp">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.331 0-4.512-.638-6.39-1.752l-.446-.27-2.633.882.882-2.633-.27-.446A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
  </svg>
</a>
<div class="whatsapp-float-pulse"></div>`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(floatingButtonCode)
    setCopiedCode(true)
    toast.success('Código del botón flotante copiado')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="size-5 text-green-600" />
          Botón Flotante de WhatsApp
        </CardTitle>
        <CardDescription>Generá un botón flotante para tu sitio web que abra WhatsApp directamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número de teléfono</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5491112345678"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mensaje pre-cargado</Label>
            <Input
              value={prefilledMessage}
              onChange={(e) => setPrefilledMessage(e.target.value)}
              placeholder="Mensaje que verá el visitante..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Posición del botón</Label>
          <div className="flex gap-2">
            <Button
              variant={position === 'bottom-right' ? 'default' : 'outline'}
              size="sm"
              className={position === 'bottom-right' ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs' : 'h-8 text-xs'}
              onClick={() => setPosition('bottom-right')}
            >
              Abajo Derecha
            </Button>
            <Button
              variant={position === 'bottom-left' ? 'default' : 'outline'}
              size="sm"
              className={position === 'bottom-left' ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs' : 'h-8 text-xs'}
              onClick={() => setPosition('bottom-left')}
            >
              Abajo Izquierda
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vista previa</Label>
          <div className="bg-white border rounded-lg h-48 relative overflow-hidden">
            <div className="p-4">
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
            {/* Floating button preview */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute bottom-4 ${position === 'bottom-right' ? 'right-4' : 'left-4'} w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
              aria-label="Chatear por WhatsApp"
            >
              <MessageCircle className="size-7 text-white" />
            </a>
          </div>
        </div>

        {/* Generated code */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Code className="size-4 text-emerald-600" />
            Código HTML/CSS
          </Label>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto max-h-64 border border-gray-800 custom-scrollbar">
              {floatingButtonCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={handleCopyCode}
            >
              {copiedCode ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// QR Code Section
// ============================================
function QRCodeSection() {
  const [phoneNumber, setPhoneNumber] = useState('5491112345678')
  const [prefilledMessage, setPrefilledMessage] = useState('Hola, quiero info sobre planes de salud')
  const [copied, setCopied] = useState(false)

  const waLink = getWhatsAppLink(phoneNumber, prefilledMessage)

  const handleCopy = () => {
    navigator.clipboard.writeText(waLink)
    setCopied(true)
    toast.success('Link copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="size-5 text-gray-600" />
          Código QR para WhatsApp
        </CardTitle>
        <CardDescription>Generá un código QR para materiales impresos, tarjetas y flyers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número de teléfono</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5491112345678"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mensaje pre-cargado</Label>
            <Input
              value={prefilledMessage}
              onChange={(e) => setPrefilledMessage(e.target.value)}
              placeholder="Mensaje al escanear QR..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Link para generar QR</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 rounded px-3 py-2 text-xs text-emerald-700 break-all border">
              {waLink}
            </code>
            <Button variant="outline" size="sm" className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        {/* QR code placeholder and instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <QrCode className="size-16 text-gray-300" />
            </div>
            <p className="text-xs text-gray-400">Vista previa del QR</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Pasos para generar el QR:</p>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0 mt-0.5">1</Badge>
                <span>Copiá el link wa.me de arriba</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0 mt-0.5">2</Badge>
                <span>Ingresa a un generador de QR gratuito:
                  <a href="https://www.qr-code-generator.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline ml-1">
                    qr-code-generator.com
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0 mt-0.5">3</Badge>
                <span>Pegá el link y generá el código QR</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0 mt-0.5">4</Badge>
                <span>Descargalo y usalo en tus materiales</span>
              </li>
            </ol>

            <Separator />

            <p className="text-xs text-gray-500">
              <strong>Ideas de uso:</strong> Tarjetas personales, flyers, cartelería en local,
              stickers en mostrador, firma de emails, folletos de obras sociales.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Social Media Links Generator
// ============================================
function SocialMediaLinks() {
  const [phoneNumber, setPhoneNumber] = useState('5491112345678')
  const [defaultMessage, setDefaultMessage] = useState('Hola, vi su publicación sobre planes de salud y me interesa saber más')

  const waLink = getWhatsAppLink(phoneNumber, defaultMessage)

  const platforms = [
    {
      name: 'Instagram',
      icon: <Instagram className="size-5 text-pink-600" />,
      tip: 'Poné el link en tu biografía (bio). Usá servicios como Linktree si necesitás múltiples links.',
      color: 'border-pink-200 bg-pink-50',
    },
    {
      name: 'Facebook',
      icon: <Facebook className="size-5 text-blue-600" />,
      tip: 'Agregá el link en la sección "Acerca de" de tu página y en los botones de acción.',
      color: 'border-blue-200 bg-blue-50',
    },
    {
      name: 'Google Ads',
      icon: <Globe className="size-5 text-red-500" />,
      tip: 'Usá este link como destino de tus anuncios. Podés crear diferentes mensajes para cada campaña.',
      color: 'border-red-200 bg-red-50',
    },
    {
      name: 'Email / Firma',
      icon: <Send className="size-5 text-purple-600" />,
      tip: 'Agregá un botón "Consultanos por WhatsApp" en tu firma de email con este link.',
      color: 'border-purple-200 bg-purple-50',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="size-5 text-emerald-600" />
          Links para Redes Sociales
        </CardTitle>
        <CardDescription>Generá links de WhatsApp para cada plataforma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número de teléfono</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="5491112345678"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mensaje por defecto</Label>
            <Input
              value={defaultMessage}
              onChange={(e) => setDefaultMessage(e.target.value)}
              placeholder="Mensaje que verán al hacer clic..."
            />
          </div>
        </div>

        {/* Link generado */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Link generado</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 rounded px-3 py-2 text-xs text-emerald-700 break-all border">
              {waLink}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                navigator.clipboard.writeText(waLink)
                toast.success('Link copiado al portapapeles')
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Platform cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((platform) => (
            <div key={platform.name} className={`rounded-lg border p-4 ${platform.color}`}>
              <div className="flex items-center gap-2 mb-2">
                {platform.icon}
                <span className="font-medium text-sm text-gray-800">{platform.name}</span>
              </div>
              <p className="text-xs text-gray-600">{platform.tip}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-[11px] bg-white/80"
                onClick={() => {
                  navigator.clipboard.writeText(waLink)
                  toast.success(`Link copiado para ${platform.name}`)
                }}
              >
                <Copy className="size-3 mr-1" />
                Copiar link
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
