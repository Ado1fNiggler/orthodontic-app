import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Button from './Button'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  closable?: boolean
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }>
  onClose?: () => void
}

export interface ToastState {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const Toast: React.FC<ToastProps & { onRemove: (id: string) => void }> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  closable = true,
  actions = [],
  onClose,
  onRemove
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onRemove, onClose])

  const handleClose = () => {
    onRemove(id)
    onClose?.()
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-success-400" />
      case 'error':
        return <ExclamationCircleIcon className="h-6 w-6 text-error-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-warning-400" />
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-primary-400" />
    }
  }

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-success-200',
          bg: 'bg-success-50',
          title: 'text-success-800',
          message: 'text-success-700'
        }
      case 'error':
        return {
          border: 'border-error-200',
          bg: 'bg-error-50',
          title: 'text-error-800',
          message: 'text-error-700'
        }
      case 'warning':
        return {
          border: 'border-warning-200',
          bg: 'bg-warning-50',
          title: 'text-warning-800',
          message: 'text-warning-700'
        }
      case 'info':
      default:
        return {
          border: 'border-primary-200',
          bg: 'bg-primary-50',
          title: 'text-primary-800',
          message: 'text-primary-700'
        }
    }
  }

  const typeClasses = getTypeClasses()

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={clsx([
        'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto overflow-hidden border',
        typeClasses.border
      ])}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={clsx(['text-sm font-medium', typeClasses.title])}>
                {title}
              </p>
            )}
            <p className={clsx([
              'text-sm',
              title ? 'mt-1' : '',
              typeClasses.message
            ])}>
              {message}
            </p>
            
            {actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'primary'}
                    onClick={() => {
                      action.action()
                      handleClose()
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {closable && (
            <div className="ml-4 flex-shrink-0 flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar for duration */}
      {duration > 0 && (
        <div className="h-1 bg-gray-200">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={clsx([
              'h-full',
              type === 'success' && 'bg-success-400',
              type === 'error' && 'bg-error-400',
              type === 'warning' && 'bg-warning-400',
              type === 'info' && 'bg-primary-400'
            ])}
          />
        </div>
      )}
    </motion.div>
  )
}

// Toast Container Component
export const ToastContainer: React.FC<{
  toasts: ToastProps[]
  position?: ToastProps['position']
  onRemove: (id: string) => void
}> = ({ toasts, position = 'top-right', onRemove }) => {
  const getContainerClasses = () => {
    const baseClasses = 'fixed z-50 p-4 space-y-4 pointer-events-none'
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-0 right-0`
      case 'top-left':
        return `${baseClasses} top-0 left-0`
      case 'bottom-right':
        return `${baseClasses} bottom-0 right-0`
      case 'bottom-left':
        return `${baseClasses} bottom-0 left-0`
      case 'top-center':
        return `${baseClasses} top-0 left-1/2 transform -translate-x-1/2`
      case 'bottom-center':
        return `${baseClasses} bottom-0 left-1/2 transform -translate-x-1/2`
      default:
        return `${baseClasses} top-0 right-0`
    }
  }

  return (
    <div className={getContainerClasses()}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Utility functions for creating toasts
export const createToast = {
  success: (message: string, options?: Partial<ToastProps>) => ({
    type: 'success' as const,
    message,
    ...options
  }),
  
  error: (message: string, options?: Partial<ToastProps>) => ({
    type: 'error' as const,
    message,
    duration: 0, // Error toasts don't auto-dismiss by default
    ...options
  }),
  
  warning: (message: string, options?: Partial<ToastProps>) => ({
    type: 'warning' as const,
    message,
    ...options
  }),
  
  info: (message: string, options?: Partial<ToastProps>) => ({
    type: 'info' as const,
    message,
    ...options
  })
}

// Hook for using toasts
export const useToast = () => {
  // This would typically use a global state management solution
  // For now, it's a placeholder that would integrate with your state management
  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    // Implementation would depend on your state management solution
    console.log('Add toast:', toast)
  }

  const removeToast = (id: string) => {
    console.log('Remove toast:', id)
  }

  const success = (message: string, options?: Partial<ToastProps>) => {
    addToast(createToast.success(message, options))
  }

  const error = (message: string, options?: Partial<ToastProps>) => {
    addToast(createToast.error(message, options))
  }

  const warning = (message: string, options?: Partial<ToastProps>) => {
    addToast(createToast.warning(message, options))
  }

  const info = (message: string, options?: Partial<ToastProps>) => {
    addToast(createToast.info(message, options))
  }

  return {
    success,
    error,
    warning,
    info,
    addToast,
    removeToast
  }
}

export default Toast