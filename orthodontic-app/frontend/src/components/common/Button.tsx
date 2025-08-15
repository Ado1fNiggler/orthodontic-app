import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { clsx } from 'clsx'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  rounded?: boolean
  animate?: boolean
  motionProps?: MotionProps
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = false,
  animate = true,
  motionProps,
  disabled,
  ...props
}, ref) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    fullWidth && 'w-full',
    rounded ? 'rounded-full' : 'rounded-lg'
  ]

  const variantClasses = {
    primary: [
      'bg-primary-600 text-white shadow-sm',
      'hover:bg-primary-700 hover:shadow-md',
      'focus:ring-primary-500',
      'active:bg-primary-800'
    ],
    secondary: [
      'bg-gray-200 text-gray-900',
      'hover:bg-gray-300',
      'focus:ring-gray-500',
      'active:bg-gray-400'
    ],
    success: [
      'bg-success-600 text-white shadow-sm',
      'hover:bg-success-700 hover:shadow-md',
      'focus:ring-success-500',
      'active:bg-success-800'
    ],
    warning: [
      'bg-warning-600 text-white shadow-sm',
      'hover:bg-warning-700 hover:shadow-md',
      'focus:ring-warning-500',
      'active:bg-warning-800'
    ],
    error: [
      'bg-error-600 text-white shadow-sm',
      'hover:bg-error-700 hover:shadow-md',
      'focus:ring-error-500',
      'active:bg-error-800'
    ],
    outline: [
      'border border-gray-300 bg-white text-gray-700 shadow-sm',
      'hover:bg-gray-50 hover:border-gray-400',
      'focus:ring-primary-500',
      'active:bg-gray-100'
    ],
    ghost: [
      'text-gray-700 bg-transparent',
      'hover:bg-gray-100',
      'focus:ring-primary-500',
      'active:bg-gray-200'
    ]
  }

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }

  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-5 w-5'
  }

  const classes = clsx([
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    className
  ])

  const iconSize = iconSizeClasses[size]
  const isDisabled = disabled || loading

  const content = (
    <>
      {loading && (
        <LoadingSpinner 
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} 
          className={clsx(
            leftIcon || children ? 'mr-2' : '',
            variant === 'primary' || variant === 'success' || variant === 'warning' || variant === 'error' 
              ? 'text-white' 
              : 'text-current'
          )}
        />
      )}
      
      {!loading && leftIcon && (
        <span className={clsx(iconSize, children ? 'mr-2' : '')}>
          {leftIcon}
        </span>
      )}
      
      {children && (
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>
      )}
      
      {!loading && rightIcon && (
        <span className={clsx(iconSize, children ? 'ml-2' : '')}>
          {rightIcon}
        </span>
      )}
    </>
  )

  const buttonProps = {
    ref,
    className: classes,
    disabled: isDisabled,
    ...props
  }

  if (animate) {
    const defaultMotionProps: MotionProps = {
      whileHover: isDisabled ? {} : { scale: 1.02 },
      whileTap: isDisabled ? {} : { scale: 0.98 },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }

    return (
      <motion.button
        {...buttonProps}
        {...defaultMotionProps}
        {...motionProps}
      >
        {content}
      </motion.button>
    )
  }

  return (
    <button {...buttonProps}>
      {content}
    </button>
  )
})

Button.displayName = 'Button'

export default Button