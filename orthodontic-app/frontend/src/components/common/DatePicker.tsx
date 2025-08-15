import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, isValid } from 'date-fns'
import { el } from 'date-fns/locale'
import Button from './Button'
import Input from './Input'

interface DatePickerProps {
  value?: Date | string | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  format?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  clearable?: boolean
  showTodayButton?: boolean
  showWeekNumbers?: boolean
  highlightWeekends?: boolean
  disabledDates?: Date[]
  customDayRenderer?: (date: Date, isSelected: boolean, isToday: boolean, isDisabled: boolean) => React.ReactNode
  onFocus?: () => void
  onBlur?: () => void
  className?: string
  calendarClassName?: string
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Επιλογή ημερομηνίας',
  format: dateFormat = 'dd/MM/yyyy',
  minDate,
  maxDate,
  disabled = false,
  error,
  size = 'md',
  fullWidth = true,
  clearable = true,
  showTodayButton = true,
  showWeekNumbers = false,
  highlightWeekends = true,
  disabledDates = [],
  customDayRenderer,
  onFocus,
  onBlur,
  className,
  calendarClassName
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [inputValue, setInputValue] = useState('')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse and normalize value
  const selectedDate = (() => {
    if (!value) return null
    if (typeof value === 'string') {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : null
    }
    return value instanceof Date ? value : null
  })()

  // Update input value when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, dateFormat, { locale: el }))
      setCurrentMonth(selectedDate)
    } else {
      setInputValue('')
    }
  }, [selectedDate, dateFormat])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle input change (manual typing)
  const handleInputChange = (inputVal: string) => {
    setInputValue(inputVal)
    
    // Try to parse the input as a date
    try {
      const parts = inputVal.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const year = parseInt(parts[2], 10)
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const date = new Date(year, month, day)
          if (isValid(date) && !isDateDisabled(date)) {
            onChange?.(date)
            setCurrentMonth(date)
          }
        }
      }
    } catch {
      // Invalid date format, ignore
    }
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    
    onChange?.(date)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Handle clear
  const handleClear = () => {
    onChange?.(null)
    setInputValue('')
    inputRef.current?.focus()
  }

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return disabledDates.some(disabledDate => isSameDay(date, disabledDate))
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    if (!isDateDisabled(today)) {
      onChange?.(today)
      setIsOpen(false)
    }
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = []
    let day = calendarStart

    while (day <= calendarEnd) {
      days.push(new Date(day))
      day = addDays(day, 1)
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const weekdays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ']

  return (
    <div ref={containerRef} className={clsx(['relative', fullWidth && 'w-full'])}>
      {/* Input Field */}
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          setIsOpen(true)
          onFocus?.()
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        size={size}
        fullWidth={fullWidth}
        className={className}
        leftIcon={<CalendarDaysIcon />}
        rightIcon={
          clearable && selectedDate ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={clsx([
              'absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-max',
              calendarClassName
            ])}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="p-1"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              
              <h3 className="text-lg font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: el })}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="p-1"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {/* Week Numbers Header */}
              {showWeekNumbers && (
                <div className="text-xs font-medium text-gray-500 text-center py-2">
                  #
                </div>
              )}
              
              {/* Weekday Headers */}
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-gray-500 text-center py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isTodayDate = isToday(day)
                const isDisabled = isDateDisabled(day)
                const isWeekend = day.getDay() === 0 || day.getDay() === 6

                // Week number (show at the start of each week)
                const showWeekNumber = showWeekNumbers && index % 7 === 0
                const weekNumber = showWeekNumber 
                  ? format(day, 'w', { locale: el })
                  : null

                return (
                  <div key={day.toISOString()} className="contents">
                    {/* Week Number */}
                    {showWeekNumber && (
                      <div className="text-xs text-gray-400 text-center py-2">
                        {weekNumber}
                      </div>
                    )}
                    
                    {/* Day Button */}
                    <button
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled}
                      className={clsx([
                        'relative w-8 h-8 text-sm rounded-md transition-all duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500',
                        
                        // Base styles
                        isCurrentMonth 
                          ? 'text-gray-900' 
                          : 'text-gray-400',
                        
                        // Selected state
                        isSelected && [
                          'bg-primary-600 text-white font-medium',
                          'hover:bg-primary-700'
                        ],
                        
                        // Today indicator
                        !isSelected && isTodayDate && [
                          'bg-primary-50 text-primary-700 font-medium',
                          'ring-1 ring-primary-200'
                        ],
                        
                        // Weekend highlighting
                        !isSelected && !isTodayDate && highlightWeekends && isWeekend && isCurrentMonth && [
                          'text-error-600'
                        ],
                        
                        // Hover state
                        !isSelected && !isDisabled && [
                          'hover:bg-gray-100'
                        ],
                        
                        // Disabled state
                        isDisabled && [
                          'text-gray-300 cursor-not-allowed'
                        ]
                      ])}
                    >
                      {customDayRenderer ? 
                        customDayRenderer(day, !!isSelected, isTodayDate, isDisabled) :
                        format(day, 'd')
                      }
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Calendar Footer */}
            {showTodayButton && (
              <div className="flex justify-center pt-4 border-t border-gray-200 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  disabled={isDateDisabled(new Date())}
                >
                  Σήμερα
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Range Date Picker Component
export const DateRangePicker: React.FC<{
  startDate?: Date | null
  endDate?: Date | null
  onChange?: (startDate: Date | null, endDate: Date | null) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}> = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'Επιλογή περιόδου',
  disabled = false,
  error,
  size = 'md',
  fullWidth = true,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectingEnd, setSelectingEnd] = useState(false)

  const formatValue = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
    } else if (startDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ...`
    }
    return ''
  }

  const handleDateSelect = (date: Date) => {
    if (!selectingEnd && (!startDate || date < startDate)) {
      // Selecting start date
      onChange?.(date, null)
      setSelectingEnd(true)
    } else {
      // Selecting end date
      const newStartDate = startDate || date
      const newEndDate = date >= newStartDate ? date : newStartDate
      onChange?.(date < newStartDate ? date : newStartDate, newEndDate)
      setIsOpen(false)
      setSelectingEnd(false)
    }
  }

  const handleClear = () => {
    onChange?.(null, null)
    setSelectingEnd(false)
  }

  return (
    <div className={clsx(['relative', fullWidth && 'w-full'])}>
      <Input
        value={formatValue()}
        readOnly
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        size={size}
        fullWidth={fullWidth}
        className={clsx(['cursor-pointer', className])}
        leftIcon={<CalendarDaysIcon />}
        rightIcon={
          (startDate || endDate) ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
          >
            <div className="text-sm text-gray-600 mb-2">
              {!startDate ? 'Επιλέξτε ημερομηνία έναρξης' :
               selectingEnd ? 'Επιλέξτε ημερομηνία λήξης' : 
               'Περίοδος επιλέχθηκε'}
            </div>
            
            <DatePicker
              value={selectingEnd ? endDate : startDate}
              onChange={handleDateSelect}
              showTodayButton={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DatePicker