import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children?: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236366f1" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* App Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Orthodontic App
          </h1>
          <p className="text-gray-600">
            Σύστημα Διαχείρισης Ορθοδοντικού Ιατρείου
          </p>
        </motion.div>

        {/* Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100"
        >
          {children || <Outlet />}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <a
              href="/terms"
              className="hover:text-primary-600 transition-colors"
            >
              Όροι Χρήσης
            </a>
            <span>•</span>
            <a
              href="/privacy"
              className="hover:text-primary-600 transition-colors"
            >
              Πολιτική Απορρήτου
            </a>
            <span>•</span>
            <a
              href="/support"
              className="hover:text-primary-600 transition-colors"
            >
              Υποστήριξη
            </a>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>
              © 2025 Dr. Liougiourou Orthodontic Clinic. 
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>
              Όλα τα δικαιώματα κατοχυρωμένα.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Floating Shape 1 */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20"
        />

        {/* Floating Shape 2 */}
        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [0, -3, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-40 right-16 w-20 h-20 bg-gradient-to-br from-secondary-200 to-secondary-300 rounded-full opacity-20"
        />

        {/* Floating Shape 3 */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-40 left-20 w-16 h-16 bg-gradient-to-br from-success-200 to-success-300 rounded-full opacity-20"
        />

        {/* Floating Shape 4 */}
        <motion.div
          animate={{
            y: [0, 12, 0],
            rotate: [0, 8, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-warning-200 to-warning-300 rounded-full opacity-20"
        />
      </div>

      {/* Version Info */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-400 z-20">
        v1.0.0
      </div>

      {/* Language Selector */}
      <div className="fixed bottom-4 right-4 z-20">
        <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          🇬🇷 ΕΛ
        </button>
      </div>
    </div>
  )
}

export default AuthLayout