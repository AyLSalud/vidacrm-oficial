'use client'

import * as React from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

// ============================================
// SCHEMA
// ============================================

const leadCreateSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().optional(),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  channel: z.string().default('whatsapp'),
  planInterest: z.string().optional(),
  currentCoverage: z.string().optional(),
  priority: z.string().default('medium'),
  notes: z.string().optional(),
})

type LeadCreateFormValues = z.infer<typeof leadCreateSchema>

// ============================================
// PROPS
// ============================================

interface LeadCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ============================================
// COMPONENT
// ============================================

export function LeadCreateDialog({ open, onOpenChange }: LeadCreateDialogProps) {
  const queryClient = useQueryClient()

  // Fetch pipeline stages to get the default (first) stage
  const { data: stages = [] } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const res = await fetch('/api/pipeline-stages')
      if (!res.ok) throw new Error('Error cargando etapas')
      return res.json()
    },
  })

  const form = useForm<LeadCreateFormValues>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      channel: 'whatsapp',
      planInterest: '',
      currentCoverage: '',
      priority: 'medium',
      notes: '',
    },
  })

  // Create lead mutation
  const createMutation = useMutation({
    mutationFn: async (data: LeadCreateFormValues & { pipelineStageId: string }) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error creando lead')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead creado exitosamente')
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear lead')
    },
  })

  const onSubmit = (data: LeadCreateFormValues) => {
    // Get the first pipeline stage as default
    const defaultStageId = stages.length > 0 ? stages[0].id : ''
    if (!defaultStageId) {
      toast.error('No hay etapas de pipeline configuradas. Crea al menos una etapa primero.')
      return
    }

    createMutation.mutate({
      ...data,
      email: data.email || undefined,
      pipelineStageId: defaultStageId,
    })
  }

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-emerald-600" />
            Nuevo Lead
          </DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo lead en el pipeline.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name fields */}
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

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="11 1234-5678"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">
                    Formato Argentina: código de área + número (ej: 11 1234-5678)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
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

            {/* Channel */}
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal de ingreso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar canal" />
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

            {/* Product interest */}
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

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el lead..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    Crear Lead
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
