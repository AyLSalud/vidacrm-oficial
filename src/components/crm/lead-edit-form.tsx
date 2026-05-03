'use client'

import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// ============================================
// SCHEMA
// ============================================

const leadEditSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().optional(),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  channel: z.string(),
  planInterest: z.string().optional(),
  currentCoverage: z.string().optional(),
  familyGroup: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  responseStatus: z.string(),
  nextFollowUp: z.string().optional(),
  notes: z.string().optional(),
})

type LeadEditFormValues = z.infer<typeof leadEditSchema>

// ============================================
// PROPS
// ============================================

interface Lead {
  id: string
  firstName: string
  lastName: string | null
  phone: string
  email: string | null
  channel: string
  status: string
  priority: string
  responseStatus: string
  planInterest: string | null
  currentCoverage: string | null
  familyGroup: string | null
  nextFollowUp: string | null
  notes: string | null
}

interface LeadEditFormProps {
  lead: Lead
  onSuccess: () => void
  onCancel: () => void
}

// ============================================
// COMPONENT
// ============================================

export function LeadEditForm({ lead, onSuccess, onCancel }: LeadEditFormProps) {
  const form = useForm<LeadEditFormValues>({
    resolver: zodResolver(leadEditSchema),
    defaultValues: {
      firstName: lead.firstName,
      lastName: lead.lastName || '',
      phone: lead.phone,
      email: lead.email || '',
      channel: lead.channel,
      planInterest: lead.planInterest || '',
      currentCoverage: lead.currentCoverage || '',
      familyGroup: lead.familyGroup || '',
      status: lead.status,
      priority: lead.priority,
      responseStatus: lead.responseStatus,
      nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.split('T')[0] : '',
      notes: lead.notes || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: LeadEditFormValues) => {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          email: data.email || null,
          nextFollowUp: data.nextFollowUp || null,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error actualizando lead')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Lead actualizado correctamente')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar lead')
    },
  })

  const onSubmit = (data: LeadEditFormValues) => {
    updateMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal info section */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Datos Personales</h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="11 1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Status section */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Estado y Prioridad</h4>
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="won">Ganado</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                      <SelectItem value="paused">En pausa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Respuesta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="responded">Respondió</SelectItem>
                      <SelectItem value="not_responding">No responde</SelectItem>
                      <SelectItem value="conversation_started">En conversación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal de ingreso</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="referido">Referido</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextFollowUp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próximo seguimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Product section */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Producto y Cobertura</h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="planInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan de interés</FormLabel>
                  <FormControl>
                    <Input placeholder="Plan 2100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentCoverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cobertura actual</FormLabel>
                  <FormControl>
                    <Input placeholder="OSDE, Swiss Medical..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-3">
            <FormField
              control={form.control}
              name="familyGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo familiar</FormLabel>
                  <FormControl>
                    <Input placeholder="Esposa + 2 hijos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Observaciones</h4>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            <X className="size-4 mr-1" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
