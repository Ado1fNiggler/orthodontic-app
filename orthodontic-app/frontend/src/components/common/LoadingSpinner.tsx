import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'bars'
  color?: 'primary' | 'white' | 'gray' | 'success' | 'warning' | 'error'
  text?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'primary',
  text,
  fullScreen = false,
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorClasses = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600',
    success: 'border-success-600',
    warning: 'border-warning-600',
    error: 'border-error-600'
  }

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  // Default Spinner
  const DefaultSpinner = () => (
    <div
      className={clsx([
        'animate-spin rounded-full border-2 border-transparent',
        sizeClasses[size],
        `border-t-current ${colorClasses[color].replace('border-', 'border-t-')}`,
        className
      ])}
      {...props}
    />
  )

  // Dots Spinner
  const DotsSpinner = () => {
    const dotSize = {
      xs: 'h-1 w-1',
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
      xl: 'h-3 w-3'
    }

    return (
      <div className={clsx(['flex space-x-1', className])} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx([
              'rounded-full animate-pulse',
              dotSize[size],
              color === 'primary' && 'bg-primary-600',
              color === 'white' && 'bg-white',
              color === 'gray' && 'bg-gray-600',
              color === 'success' && 'bg-success-600',
              color === 'warning' && 'bg-warning-600',
              color === 'error' && 'bg-error-600'
            ])}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }

  // Pulse Spinner
  const PulseSpinner = () => (
    <div
      className={clsx([
        'animate-ping rounded-full',
        sizeClasses[size],
        color === 'primary' && 'bg-primary-600',
        color === 'white' && 'bg-white',
        color === 'gray' && 'bg-gray-600',
        color === 'success' && 'bg-success-600',
        color === 'warning' && 'bg-warning-600',
        color === 'error' && 'bg-error-600',
        className
      ])}
      {...props}
    />
  )

  // Bounce Spinner
  const BounceSpinner = () => {
    const ballSize = {
      xs: 'h-1 w-1',
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
      xl: 'h-3 w-3'
    }

    return (
      <div className={clsx(['flex space-x-1', className])} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx([
              'rounded-full animate-bounce',
              ballSize[size],
              color === 'primary' && 'bg-primary-600',
              color === 'white' && 'bg-white',
              color === 'gray' && 'bg-gray-600',
              color === 'success' && 'bg-success-600',
              color === 'warning' && 'bg-warning-600',
              color === 'error' && 'bg-error-600'
            ])}
            style={{
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    )
  }

  // Bars Spinner
  const BarsSpinner = () => {
    const barSize = {
      xs: 'h-3 w-0.5',
      sm: 'h-4 w-0.5',
      md: 'h-6 w-1',
      lg: 'h-8 w-1',
      xl: 'h-12 w-1.5'
    }

    return (
      <div className={clsx(['flex space-x-1 items-end', className])} {...props}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx([
              'rounded-sm animate-pulse',
              barSize[size],
              color === 'primary' && 'bg-primary-600',
              color === 'white' && 'bg-white',
              color === 'gray' && 'bg-gray-600',
              color === 'success' && 'bg-success-600',
              color === 'warning' && 'bg-warning-600',
              color === 'error' && 'bg-error-600'
            ])}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />
      case 'pulse':
        return <PulseSpinner />
      case 'bounce':
        return <BounceSpinner />
      case 'bars':
        return <BarsSpinner />
      default:
        return <DefaultSpinner />
    }
  }

  const content = (
    <div className="flex flex-col items-center space-y-2">
      {renderSpinner()}
      {text && (
        <p className={clsx([
          'font-medium',
          textSizeClasses[size],
          color === 'primary' && 'text-primary-600',
          color === 'white' && 'text-white',
          color === 'gray' && 'text-gray-600',
          color === 'success' && 'text-success-600',
          color === 'warning' && 'text-warning-600',
          color === 'error' && 'text-error-600'
        ])}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

// Skeleton Components
export const SkeletonLine: React.FC<{
  width?: string | number
  height?: string | number
  className?: string
}> = ({ width = '100%', height = '1rem', className }) => (
  <div
    className={clsx([
      'animate-pulse bg-gray-200 rounded',
      className
    ])}
    style={{ width, height }}
  />
)

export const SkeletonCircle: React.FC<{
  size?: string | number
  className?: string
}> = ({ size = '3rem', className }) => (
  <div
    className={clsx([
      'animate-pulse bg-gray-200 rounded-full',
      className
    ])}
    style={{ width: size, height: size }}
  />
)

export const SkeletonText: React.FC<{
  lines?: number
  className?: string
}> = ({ lines = 3, className }) => (
  <div className={clsx(['space-y-2', className])}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine
        key={i}
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{
  showAvatar?: boolean
  showHeader?: boolean
  lines?: number
  className?: string
}> = ({ showAvatar = false, showHeader = true, lines = 3, className }) => (
  <div className={clsx(['animate-pulse p-4', className])}>
    {showHeader && (
      <div className="flex items-center space-x-3 mb-4">
        {showAvatar && <SkeletonCircle size="2.5rem" />}
        <div className="flex-1 space-y-2">
          <SkeletonLine width="60%" height="1.25rem" />
          <SkeletonLine width="40%" height="1rem" />
        </div>
      </div>
    )}
    <SkeletonText lines={lines} />
  </div>
)

export const SkeletonTable: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={clsx(['animate-pulse', className])}>
    {/* Header */}
    <div className="flex space-x-4 mb-4">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonLine key={i} height="1.5rem" />
      ))}
    </div>
    
    {/* Rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLine key={colIndex} height="1.25rem" />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export default LoadingSpinner