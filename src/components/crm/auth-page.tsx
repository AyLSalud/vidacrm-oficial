'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Loader2, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function AuthPage() {
  const router = useRouter()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Completá email y contraseña')
      return
    }
    setLoginLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Email o contraseña incorrectos')
      } else {
        toast.success('¡Bienvenido a VidaCRM!')
        router.refresh()
        window.location.reload()
      }
    } catch {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword) {
      toast.error('Completá todos los campos obligatorios')
      return
    }
    if (regPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setRegLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, phone: regPhone || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al registrarse')
        return
      }
      // Auto-login after registration
      const result = await signIn('credentials', {
        email: regEmail,
        password: regPassword,
        redirect: false,
      })
      if (result?.ok) {
        toast.success('¡Cuenta creada! Bienvenido a VidaCRM')
        router.refresh()
        window.location.reload()
      }
    } catch {
      toast.error('Error al crear la cuenta')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200 mb-4">
            <Heart className="size-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">VidaCRM</h1>
          <p className="text-sm text-gray-500 mt-1">Planes de Salud · Argentina</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 shadow-emerald-100/50">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full rounded-none border-b bg-transparent p-0 h-auto">
              <TabsTrigger
                value="login"
                className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-sm"
              >
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-sm"
              >
                Crear Cuenta
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Iniciar Sesión</CardTitle>
                  <CardDescription>Ingresá a tu CRM de ventas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {/* Demo credentials hint */}
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-800 mb-1">🔑 Demo:</p>
                    <p className="text-xs text-emerald-700">Email: admin@vidacrm.com</p>
                    <p className="text-xs text-emerald-700">Contraseña: admin123</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" /> Ingresando...</>
                    ) : (
                      <>Ingresar <ArrowRight className="size-4 ml-2" /></>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegister}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Crear Cuenta</CardTitle>
                  <CardDescription>Registrate para usar VidaCRM gratis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nombre *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="reg-name"
                        placeholder="Tu nombre"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-9"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Teléfono WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="11 1234-5678"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={regLoading}
                  >
                    {regLoading ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" /> Creando cuenta...</>
                    ) : (
                      <>Crear Cuenta <ArrowRight className="size-4 ml-2" /></>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            VidaCRM · CRM para venta de planes de salud en Argentina
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Datos seguros · Acceso privado · Plan gratuito
          </p>
        </div>
      </div>
    </div>
  )
}
