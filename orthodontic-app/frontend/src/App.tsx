import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Layout components
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Main pages
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import TreatmentDashboard from './pages/TreatmentDashboard'
import FinancialDashboard from './pages/FinancialDashboard'
import Photos from './pages/Photos'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

// Special pages
import CameraCapture from './pages/CameraCapture'
import NotFound from './pages/NotFound'
import Offline from './pages/Offline'

// Hooks and utilities
import { useAuthStore } from './store/authStore'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { useServiceWorker } from './hooks/useServiceWorker'
import LoadingSpinner from './components/common/LoadingSpinner'

// Types
interface ProtectedRouteProps {
  children: React.ReactNode
}

// Protected Route Component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Page Transition Component
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// Main App Component
function App() {
  const { initializeAuth, user } = useAuthStore()
  const isOnline = useNetworkStatus()
  const { updateAvailable, updateApp } = useServiceWorker()
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize authentication on app start
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuth()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [initializeAuth])

  // Handle PWA update
  useEffect(() => {
    if (updateAvailable) {
      const shouldUpdate = window.confirm(
        'Διαθέσιμη νέα έκδοση της εφαρμογής. Θέλετε να την εγκαταστήσετε τώρα;'
      )
      if (shouldUpdate) {
        updateApp()
      }
    }
  }, [updateAvailable, updateApp])

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Orthodontic App</h2>
          <p className="text-primary-100">Φορτώνει...</p>
        </div>
      </div>
    )
  }

  // Show offline page when not connected
  if (!isOnline) {
    return <Offline />
  }

  return (
    <div className="App">
      {/* PWA Update Banner */}
      {updateAvailable && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 bg-primary-600 text-white p-4 text-center z-50"
        >
          <p className="text-sm">
            Νέα έκδοση διαθέσιμη!{' '}
            <button
              onClick={updateApp}
              className="underline font-medium hover:no-underline"
            >
              Ενημέρωση τώρα
            </button>
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth/*"
            element={
              <PublicRoute>
                <AuthLayout>
                  <Routes>
                    <Route
                      path="login"
                      element={
                        <PageTransition>
                          <Login />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="register"
                      element={
                        <PageTransition>
                          <Register />
                        </PageTransition>
                      }
                    />
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                  </Routes>
                </AuthLayout>
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    {/* Dashboard */}
                    <Route
                      path="dashboard"
                      element={
                        <PageTransition>
                          <Dashboard />
                        </PageTransition>
                      }
                    />

                    {/* Patient Management */}
                    <Route
                      path="patients"
                      element={
                        <PageTransition>
                          <Patients />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="patients/:id"
                      element={
                        <PageTransition>
                          <PatientDetail />
                        </PageTransition>
                      }
                    />

                    {/* Treatment Management */}
                    <Route
                      path="treatments"
                      element={
                        <PageTransition>
                          <TreatmentDashboard />
                        </PageTransition>
                      }
                    />

                    {/* Financial Management */}
                    <Route
                      path="financial"
                      element={
                        <PageTransition>
                          <FinancialDashboard />
                        </PageTransition>
                      }
                    />

                    {/* Photo Management */}
                    <Route
                      path="photos"
                      element={
                        <PageTransition>
                          <Photos />
                        </PageTransition>
                      }
                    />

                    {/* Calendar */}
                    <Route
                      path="calendar"
                      element={
                        <PageTransition>
                          <Calendar />
                        </PageTransition>
                      }
                    />

                    {/* Reports */}
                    <Route
                      path="reports"
                      element={
                        <PageTransition>
                          <Reports />
                        </PageTransition>
                      }
                    />

                    {/* Settings */}
                    <Route
                      path="settings"
                      element={
                        <PageTransition>
                          <Settings />
                        </PageTransition>
                      }
                    />

                    {/* Profile */}
                    <Route
                      path="profile"
                      element={
                        <PageTransition>
                          <Profile />
                        </PageTransition>
                      }
                    />

                    {/* Camera (PWA Feature) */}
                    <Route
                      path="camera"
                      element={
                        <PageTransition>
                          <CameraCapture />
                        </PageTransition>
                      }
                    />

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* 404 Page */}
                    <Route
                      path="*"
                      element={
                        <PageTransition>
                          <NotFound />
                        </PageTransition>
                      }
                    />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App