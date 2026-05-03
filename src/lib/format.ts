import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Search,
  UserPlus,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  MessageSquare,
  StickyNote,
} from 'lucide-react'
import React from 'react'

// ============================================
// TIME & DATE HELPERS
// ============================================

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })
}

export function isOverdue(date: string | Date | null): boolean {
  if (!date) return false
  const d = new Date(date)
  return isPast(d) && !isToday(d)
}

export function formatFollowUp(date: string | Date | null): string {
  if (!date) return 'Sin programar'
  const d = new Date(date)
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  if (isPast(d)) return `Vencido - ${formatDate(d)}`
  return formatDate(d)
}

// ============================================
// WHATSAPP HELPERS
// ============================================

export function getWhatsAppLink(phone: string, message?: string): string {
  // Clean phone number - remove spaces, dashes, etc.
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  // Ensure it starts with country code for Argentina
  let formattedPhone = cleanPhone
  if (cleanPhone.startsWith('0')) {
    formattedPhone = '549' + cleanPhone.substring(1)
  } else if (!cleanPhone.startsWith('549') && !cleanPhone.startsWith('+')) {
    formattedPhone = '549' + cleanPhone
  }
  // Remove + if present
  formattedPhone = formattedPhone.replace('+', '')

  const url = `https://wa.me/${formattedPhone}`
  if (message) {
    return `${url}?text=${encodeURIComponent(message)}`
  }
  return url
}

// ============================================
// PRIORITY HELPERS
// ============================================

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return 'Alta'
    case 'medium':
      return 'Media'
    case 'low':
      return 'Baja'
    default:
      return priority
  }
}

// ============================================
// STATUS HELPERS
// ============================================

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'won':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'lost':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'paused':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'won':
      return 'Ganado'
    case 'lost':
      return 'Perdido'
    case 'paused':
      return 'En pausa'
    default:
      return status
  }
}

export function getResponseStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'responded':
      return 'Respondió'
    case 'not_responding':
      return 'No responde'
    case 'conversation_started':
      return 'En conversación'
    default:
      return status
  }
}

// ============================================
// ICON HELPERS
// ============================================

export function getResponseStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'pending':
      return React.createElement(Clock, { className: 'size-4 text-amber-500' })
    case 'responded':
      return React.createElement(CheckCircle2, { className: 'size-4 text-green-500' })
    case 'not_responding':
      return React.createElement(AlertCircle, { className: 'size-4 text-red-500' })
    case 'conversation_started':
      return React.createElement(MessageCircle, { className: 'size-4 text-emerald-500' })
    default:
      return React.createElement(HelpCircle, { className: 'size-4 text-gray-400' })
  }
}

export function getChannelIcon(channel: string): React.ReactNode {
  switch (channel) {
    case 'whatsapp':
      return React.createElement(MessageCircle, { className: 'size-4 text-green-600' })
    case 'instagram':
      return React.createElement(Instagram, { className: 'size-4 text-pink-600' })
    case 'facebook':
      return React.createElement(Facebook, { className: 'size-4 text-blue-600' })
    case 'google':
      return React.createElement(Search, { className: 'size-4 text-red-500' })
    case 'referido':
      return React.createElement(UserPlus, { className: 'size-4 text-purple-600' })
    default:
      return React.createElement(HelpCircle, { className: 'size-4 text-gray-400' })
  }
}

export function getChannelLabel(channel: string): string {
  switch (channel) {
    case 'whatsapp':
      return 'WhatsApp'
    case 'instagram':
      return 'Instagram'
    case 'facebook':
      return 'Facebook'
    case 'google':
      return 'Google'
    case 'referido':
      return 'Referido'
    case 'otro':
      return 'Otro'
    default:
      return channel
  }
}

export function getInteractionIcon(type: string): React.ReactNode {
  switch (type) {
    case 'whatsapp_sent':
      return React.createElement(MessageCircle, { className: 'size-4 text-green-600' })
    case 'whatsapp_received':
      return React.createElement(MessageCircle, { className: 'size-4 text-emerald-600' })
    case 'call':
      return React.createElement(Phone, { className: 'size-4 text-blue-500' })
    case 'email':
      return React.createElement(Mail, { className: 'size-4 text-purple-500' })
    case 'note':
      return React.createElement(StickyNote, { className: 'size-4 text-gray-500' })
    case 'stage_change':
      return React.createElement(ArrowRightLeft, { className: 'size-4 text-amber-500' })
    case 'task_completed':
      return React.createElement(CheckCircle2, { className: 'size-4 text-green-600' })
    case 'meeting':
      return React.createElement(MessageSquare, { className: 'size-4 text-teal-500' })
    default:
      return React.createElement(HelpCircle, { className: 'size-4 text-gray-400' })
  }
}

export function getInteractionColor(type: string): string {
  switch (type) {
    case 'whatsapp_sent':
      return 'bg-green-50 border-green-200'
    case 'whatsapp_received':
      return 'bg-emerald-50 border-emerald-200'
    case 'call':
      return 'bg-blue-50 border-blue-200'
    case 'email':
      return 'bg-purple-50 border-purple-200'
    case 'note':
      return 'bg-gray-50 border-gray-200'
    case 'stage_change':
      return 'bg-amber-50 border-amber-200'
    case 'task_completed':
      return 'bg-green-50 border-green-200'
    case 'meeting':
      return 'bg-teal-50 border-teal-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

export function getInteractionLabel(type: string): string {
  switch (type) {
    case 'whatsapp_sent':
      return 'WhatsApp enviado'
    case 'whatsapp_received':
      return 'WhatsApp recibido'
    case 'call':
      return 'Llamada'
    case 'email':
      return 'Email'
    case 'note':
      return 'Nota'
    case 'stage_change':
      return 'Cambio de etapa'
    case 'task_completed':
      return 'Tarea completada'
    case 'meeting':
      return 'Reunión'
    default:
      return type
  }
}

export function getTaskTypeLabel(type: string): string {
  switch (type) {
    case 'follow_up':
      return 'Seguimiento'
    case 'call':
      return 'Llamada'
    case 'meeting':
      return 'Reunión'
    case 'send_proposal':
      return 'Enviar propuesta'
    case 'send_info':
      return 'Enviar info'
    case 'reminder':
      return 'Recordatorio'
    default:
      return type
  }
}

export function getTaskTypeColor(type: string): string {
  switch (type) {
    case 'follow_up':
      return 'bg-emerald-100 text-emerald-700'
    case 'call':
      return 'bg-blue-100 text-blue-700'
    case 'meeting':
      return 'bg-purple-100 text-purple-700'
    case 'send_proposal':
      return 'bg-amber-100 text-amber-700'
    case 'send_info':
      return 'bg-teal-100 text-teal-700'
    case 'reminder':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function getFinalResultLabel(result: string): string {
  switch (result) {
    case 'won':
      return 'Ganado'
    case 'lost_no_interest':
      return 'Sin interés'
    case 'lost_price':
      return 'Precio'
    case 'lost_competition':
      return 'Competencia'
    case 'lost_no_response':
      return 'Sin respuesta'
    case 'other':
      return 'Otro'
    default:
      return result
  }
}
