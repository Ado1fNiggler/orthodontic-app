import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@components/common/Header'
import Sidebar from '@components/common/Sidebar'
import MobileNav from '@components/common/MobileNav'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'

interface MainLayoutProps {
  children?: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const { user } = useAuthStore()
  const { notifications, markAsRead } = useNotificationStore()

  // Check if device is mobile
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }

      // Quick navigation shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key) {
          case 'D':
            e.preventDefault()
            window.location.href = '/dashboard'
            break
          case 'P':
            e.preventDefault()
            window.location.href = '/patients'
            break
          case 'C':
            e.preventDefault()
            window.location.href = '/camera'
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  // Page title based on route
  const getPageTitle = () => {
    const path = location.pathname
    const titles: Record<string, string> = {
      '/dashboard': 'Πίνακας Ελέγχου',
      '/patients': 'Ασθενείς',
      '/treatments': 'Θεραπείες',
      '/financial': 'Οικονομικά',
      '/photos': 'Φωτογραφίες',
      '/calendar': 'Ημερολόγιο',
      '/reports': 'Αναφορές',
      '/settings': 'Ρυθμίσεις',
      '/profile': 'Προφίλ',
      '/camera': 'Κάμερα'
    }
    
    return titles[path] || 'Orthodontic App'
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className={`${
        isMobile ? 'lg:ml-0' : sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      } transition-all duration-300 ease-in-out`}>
        
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle()}
          user={user}
          notificationCount={unreadCount}
        />

        {/* Page Content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Breadcrumb Navigation */}
              <nav className="flex mb-4" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <a
                      href="/dashboard"
                      className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                      </svg>
                      Αρχική
                    </a>
                  </li>
                  {location.pathname !== '/dashboard' && (
                    <li>
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                          {getPageTitle()}
                        </span>
                      </div>
                    </li>
                  )}
                </ol>
              </nav>

              {/* Page Content with Animation */}
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {children || <Outlet />}
              </motion.div>
            </div>
          </div>
        </main>

        {/* Mobile Navigation */}
        {isMobile && (
          <MobileNav currentPath={location.pathname} />
        )}
      </div>

      {/* Notification Popup */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-strong border border-gray-200 p-4 max-w-sm"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM7 8h10M7 12h6m-6 4h6" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Νέες ειδοποιήσεις
                </p>
                <p className="text-sm text-gray-500">
                  Έχετε {unreadCount} νέες ειδοποιήσεις
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => notifications.forEach(n => !n.read && markAsRead(n.id))}
                >
                  <span className="sr-only">Κλείσιμο</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Prompt */}
      <div id="pwa-install-prompt" className="hidden fixed bottom-4 left-4 z-50">
        <div className="bg-primary-600 text-white rounded-lg p-4 shadow-strong max-w-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                Εγκατάσταση App
              </p>
              <p className="text-xs text-primary-100">
                Εγκαταστήστε την εφαρμογή για καλύτερη εμπειρία
              </p>
            </div>
            <button
              id="install-button"
              className="ml-3 bg-white text-primary-600 px-3 py-1 rounded text-xs font-medium hover:bg-primary-50"
            >
              Εγκατάσταση
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainLayout