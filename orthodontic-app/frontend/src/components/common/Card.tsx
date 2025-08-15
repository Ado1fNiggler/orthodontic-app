import { forwardRef, HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { motion, MotionProps } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hoverable?: boolean
  clickable?: boolean
  loading?: boolean
  animate?: boolean
  motionProps?: MotionProps
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  extra?: React.ReactNode
  bordered?: boolean
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
  actions?: React.ReactNode[]
  align?: 'left' | 'center' | 'right' | 'between'
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  className,
  variant = 'default',
  size = 'md',
  rounded = true,
  shadow = 'sm',
  hoverable = false,
  clickable = false,
  loading = false,
  animate = false,
  motionProps,
  ...props
}, ref) => {
  const baseClasses = [
    'relative overflow-hidden transition-all duration-200',
    rounded && 'rounded-lg',
    clickable && 'cursor-pointer select-none'
  ]

  const variantClasses = {
    default: [
      'bg-white border border-gray-200'
    ],
    outlined: [
      'bg-transparent border-2 border-gray-300'
    ],
    elevated: [
      'bg-white border-0'
    ],
    filled: [
      'bg-gray-50 border border-gray-100'
    ]
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }

  const hoverClasses = hoverable && [
    'hover:shadow-md hover:-translate-y-1',
    clickable && 'active:scale-[0.98]'
  ]

  const classes = clsx([
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    shadowClasses[shadow],
    hoverClasses,
    loading && 'pointer-events-none',
    className
  ])

  const content = (
    <>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
            <span className="text-sm text-gray-600">Φορτώνει...</span>
          </div>
        </div>
      )}
      {children}
    </>
  )

  const cardProps = {
    ref,
    className: classes,
    ...props
  }

  if (animate) {
    const defaultMotionProps: MotionProps = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    }

    return (
      <motion.div
        {...cardProps}
        {...defaultMotionProps}
        {...motionProps}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div {...cardProps}>
      {content}
    </div>
  )
})

Card.displayName = 'Card'

// Card Header Component
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  title,
  subtitle,
  extra,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={clsx([
        'px-4 py-4 sm:px-6',
        bordered && 'border-b border-gray-200',
        className
      ])}
      {...props}
    >
      {title || subtitle || extra ? (
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {extra && (
            <div className="ml-4 flex-shrink-0">
              {extra}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// Card Body Component
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className,
  padding = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <div
      className={clsx([
        paddingClasses[padding],
        className
      ])}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Footer Component
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  bordered = true,
  actions,
  align = 'right',
  ...props
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  }

  return (
    <div
      className={clsx([
        'px-4 py-3 sm:px-6',
        bordered && 'border-t border-gray-200 bg-gray-50',
        className
      ])}
      {...props}
    >
      {actions ? (
        <div className={clsx(['flex items-center space-x-3', alignClasses[align]])}>
          {actions.map((action, index) => (
            <div key={index}>
              {action}
            </div>
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// Predefined Card Variants
export const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
    direction: 'up' | 'down' | 'neutral'
  }
  color?: 'primary' | 'success' | 'warning' | 'error'
  loading?: boolean
}> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  loading = false
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500'
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-600',
      icon: 'text-success-500'
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      icon: 'text-warning-500'
    },
    error: {
      bg: 'bg-error-50',
      text: 'text-error-600',
      icon: 'text-error-500'
    }
  }

  const getTrendIcon = () => {
    if (trend?.direction === 'up') {
      return (
        <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    } else if (trend?.direction === 'down') {
      return (
        <svg className="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <Card hoverable animate loading={loading}>
      <CardBody>
        <div className="flex items-center">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 truncate">
                {title}
              </p>
              {icon && (
                <div className={clsx([
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  colorClasses[color].bg
                ])}>
                  <span className={clsx(['w-5 h-5', colorClasses[color].icon])}>
                    {icon}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <p className={clsx([
                'text-2xl font-semibold',
                colorClasses[color].text
              ])}>
                {loading ? '...' : value}
              </p>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            {trend && (
              <div className="mt-2 flex items-center text-sm">
                {getTrendIcon()}
                <span className={clsx([
                  'ml-1 font-medium',
                  trend.direction === 'up' ? 'text-success-600' :
                  trend.direction === 'down' ? 'text-error-600' :
                  'text-gray-500'
                ])}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="ml-1 text-gray-500">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export const InfoCard: React.FC<{
  title: string
  description: string
  icon?: React.ReactNode
  actions?: React.ReactNode[]
  variant?: 'info' | 'success' | 'warning' | 'error'
}> = ({
  title,
  description,
  icon,
  actions,
  variant = 'info'
}) => {
  const variantClasses = {
    info: {
      border: 'border-primary-200',
      bg: 'bg-primary-50',
      icon: 'text-primary-600',
      title: 'text-primary-900',
      text: 'text-primary-700'
    },
    success: {
      border: 'border-success-200',
      bg: 'bg-success-50',
      icon: 'text-success-600',
      title: 'text-success-900',
      text: 'text-success-700'
    },
    warning: {
      border: 'border-warning-200',
      bg: 'bg-warning-50',
      icon: 'text-warning-600',
      title: 'text-warning-900',
      text: 'text-warning-700'
    },
    error: {
      border: 'border-error-200',
      bg: 'bg-error-50',
      icon: 'text-error-600',
      title: 'text-error-900',
      text: 'text-error-700'
    }
  }

  return (
    <Card 
      variant="outlined" 
      className={clsx([
        variantClasses[variant].border,
        variantClasses[variant].bg
      ])}
    >
      <CardBody>
        <div className="flex">
          {icon && (
            <div className="flex-shrink-0">
              <span className={clsx(['w-5 h-5', variantClasses[variant].icon])}>
                {icon}
              </span>
            </div>
          )}
          <div className={clsx(icon && 'ml-3')}>
            <h3 className={clsx([
              'text-sm font-medium',
              variantClasses[variant].title
            ])}>
              {title}
            </h3>
            <div className={clsx([
              'mt-1 text-sm',
              variantClasses[variant].text
            ])}>
              {description}
            </div>
            {actions && actions.length > 0 && (
              <div className="mt-3 flex space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default Card