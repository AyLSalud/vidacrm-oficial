'use client'

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
  X,
  Search,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

const navItems: { key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'pipeline', label: 'Pipeline', icon: LayoutGrid },
  { key: 'leads', label: 'Leads', icon: List },
  { key: 'tasks', label: 'Tareas', icon: CheckSquare },
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'ai-assistant', label: 'IA Asistente', icon: Sparkles },
  { key: 'forms', label: 'Formularios', icon: FileText },
]

function SidebarContent({ activeView, setActiveView, onClose }: { activeView: ViewMode; setActiveView: (v: ViewMode) => void; onClose?: () => void }) {
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-emerald-700">V</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Vendedor</p>
            <p className="text-[10px] text-gray-400 truncate">Plan Gratuito</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { activeView, setActiveView } = useCRMStore()
  const [showNewLead, setShowNewLead] = useState(false)
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Mobile Header */}
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
          </div>
        </header>

        {/* Main Content */}
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
      {/* Desktop Sidebar */}
      <aside className="w-[240px] bg-white border-r flex flex-col shrink-0 shadow-sm">
        <SidebarContent activeView={activeView} setActiveView={setActiveView} />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
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
            {/* Quick View Switcher (for power users) */}
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
          </div>
        </header>

        {/* Main Content */}
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

      {/* Shared Drawers/Dialogs */}
      <LeadDetailDrawer />
      <LeadCreateDialog open={showNewLead} onOpenChange={setShowNewLead} />
    </div>
  )
}
