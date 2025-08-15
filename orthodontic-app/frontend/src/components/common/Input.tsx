import { forwardRef, InputHTMLAttributes, useState, useId } from 'react'
import { clsx } from 'clsx'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import Button from './Button'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
  fullWidth?: boolean
  required?: boolean
  loading?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  fullWidth = true,
  required = false,
  loading = false,
  disabled,
  id: providedId,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const generatedId = useId()
  const id = providedId || generatedId
  const isPassword = type === 'password'
  const actualType = isPassword && showPassword ? 'text' : type
  const hasError = Boolean(error)
  const isDisabled = disabled || loading

  const baseClasses = [
    'block transition-all duration-200',
    'border border-gray-300 rounded-lg',
    'placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    fullWidth && 'w-full'
  ]

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const variantClasses = {
    default: 'bg-white',
    filled: 'bg-gray-50 border-gray-200 focus:bg-white',
    outlined: 'bg-transparent border-2'
  }

  const errorClasses = hasError && [
    'border-error-300 focus:ring-error-500 focus:border-error-500',
    variant === 'filled' && 'bg-error-50'
  ]

  const iconClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5'
  }

  const inputClasses = clsx([
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    hasError ? errorClasses : '',
    leftIcon && 'pl-10',
    (rightIcon || isPassword) && 'pr-10',
    className
  ])

  const iconSize = iconClasses[size]

  return (
    <div className={fullWidth ? 'w-full' : 'inline-block'}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={clsx([
            'block text-sm font-medium mb-1',
            hasError ? 'text-error-700' : 'text-gray-700',
            isDisabled && 'text-gray-400'
          ])}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={clsx([
            'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none',
            hasError ? 'text-error-400' : 'text-gray-400'
          ])}>
            <span className={iconSize}>
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={actualType}
          id={id}
          disabled={isDisabled}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-help` : undefined
          }
          {...props}
        />

        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {/* Loading Spinner */}
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
          )}

          {/* Error Icon */}
          {hasError && !loading && !isPassword && (
            <ExclamationCircleIcon className={clsx(iconSize, 'text-error-400 mr-2')} />
          )}

          {/* Password Toggle */}
          {isPassword && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="p-0 h-auto text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className={iconSize} />
              ) : (
                <EyeIcon className={iconSize} />
              )}
            </Button>
          )}

          {/* Custom Right Icon */}
          {rightIcon && !hasError && !isPassword && !loading && (
            <span className={clsx(iconSize, 'text-gray-400')}>
              {rightIcon}
            </span>
          )}
        </div>
      </div>

      {/* Helper Text / Error Message */}
      {(error || helperText) && (
        <div className="mt-1 text-sm">
          {error ? (
            <p id={`${id}-error`} className="text-error-600 flex items-center">
              <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              {error}
            </p>
          ) : (
            <p id={`${id}-help`} className="text-gray-500">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input