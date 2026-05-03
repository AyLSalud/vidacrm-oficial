'use client'

import { useSession, signOut } from 'next-auth/react'
import { useCRMStore, type ViewMode } from '@/store/crm-store'
import { PipelineView } from '@/components/crm/pipeline-view'
import { LeadListView } from '@/components/crm/lead-list-view'
import { TasksView } from '@/components/crm/tasks-view'
import { DashboardView } from '@/components/crm/dashboard-view'
import { WhatsAppView } from '@/components/crm/whatsapp-view'
import { AIAssistantView } from '@/components/crm/ai-assistant-view'
import { FormsView } from '@/components/crm/forms-view'
import { LeadDetailDrawer } from '@/components/crm/lead-detail-drawer'
import { LeadCreateDialog } from '@/components/crm/lead-create-dialog'
import { AuthPage } from '@/components/crm/auth-page'
import {
  LayoutGrid,
  List,
  CheckSquare,
  BarChart3,
  MessageCircle,
  Sparkles,
  FileText,
  Plus,
  Heart,
  Menu,
  LogOut,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems: { key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'pipeline', label: 'Pipeline', icon: LayoutGrid },
  { key: 'leads', label: 'Leads', icon: List },
  { key: 'tasks', label: 'Tareas', icon: CheckSquare },
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'ai-assistant', label: 'IA Asistente', icon: Sparkles },
  { key: 'forms', label: 'Formularios', icon: FileText },
]

function UserAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const sizeClass = size === 'md' ? 'size-9' : 'size-8'
  const textClass = size === 'md' ? 'text-sm' : 'text-xs'
  return (
    <Avatar className={sizeClass}>
      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

function SidebarContent({ activeView, setActiveView, onClose, session }: {
  activeView: ViewMode
  setActiveView: (v: ViewMode) => void
  onClose?: () => void
  session: any
}) {
  const userName = session?.user?.name || 'Usuario'
  const userEmail = session?.user?.email || ''

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
          <Heart className="size-5 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">VidaCRM</h1>
          <p className="text-[10px] text-gray-400 leading-tight">Planes de Salud · Argentina</p>
        </div>
      </div>

      {/* New Lead CTA */}
      <div className="px-3 mb-2">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          size="sm"
          onClick={onClose}
        >
          <Plus className="size-4 mr-1.5" />
          Nuevo Lead
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.key
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveView(item.key)
                onClose?.()
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 cursor-pointer
                ${isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`size-[18px] ${isActive ? 'text-emerald-600' : ''}`} />
              <span>{item.label}</span>
              {item.key === 'pipeline' && (
                <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                  Core
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2.5 px-2">
          <UserAvatar name={userName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-gray-400 hover:text-gray-600">
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-xs text-gray-500" disabled>
                {session?.user?.role === 'admin' ? '👑 Administrador' : '👤 Vendedor'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="size-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const { activeView, setActiveView } = useCRMStore()
  const [showNewLead, setShowNewLead] = useState(false)
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Show auth page if not authenticated
  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse">
            <Heart className="size-6 text-white fill-white" />
          </div>
          <p className="text-sm text-gray-500">Cargando VidaCRM...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  const renderView = () => {
    switch (activeView) {
      case 'pipeline': return <PipelineView />
      case 'leads': return <LeadListView />
      case 'tasks': return <TasksView />
      case 'dashboard': return <DashboardView />
      case 'whatsapp': return <WhatsAppView />
      case 'ai-assistant': return <AIAssistantView />
      case 'forms': return <FormsView />
      default: return <PipelineView />
    }
  }

  const activeLabel = navItems.find(n => n.key === activeView)?.label || 'Pipeline'
  const userName = session?.user?.name || 'Usuario'

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b px-3 py-2.5 flex items-center gap-2 shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent
                activeView={activeView}
                setActiveView={setActiveView}
                onClose={() => setMobileMenuOpen(false)}
                session={session}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
              <Heart className="size-3.5 text-white fill-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">VidaCRM</span>
          </div>

          <span className="text-xs text-emerald-600 font-medium ml-1">{activeLabel}</span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-emerald-600"
              onClick={() => setShowNewLead(true)}
            >
              <Plus className="size-4" />
            </Button>
            <UserAvatar name={userName} />
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>

        <LeadDetailDrawer />
        <LeadCreateDialog open={showNewLead} onOpenChange={setShowNewLead} />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <aside className="w-[240px] bg-white border-r flex flex-col shrink-0 shadow-sm">
        <SidebarContent activeView={activeView} setActiveView={setActiveView} session={session} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-5 py-3 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{activeLabel}</h2>
            {activeView === 'pipeline' && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                Kanban
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {navItems.slice(0, 4).map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.key
                return (
                  <Button
                    key={item.key}
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 text-xs ${isActive ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}
                    onClick={() => setActiveView(item.key)}
                  >
                    <Icon className="size-3.5" />
                  </Button>
                )
              })}
            </div>

            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowNewLead(true)}
            >
              <Plus className="size-4 mr-1" />
              Nuevo Lead
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 rounded-full">
                  <UserAvatar name={userName} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="size-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <LeadDetailDrawer />
      <LeadCreateDialog open={showNewLead} onOpenChange={setShowNewLead} />
    </div>
  )
}
