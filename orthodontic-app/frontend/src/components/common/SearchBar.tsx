import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'
import Button from './Button'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: 'patient' | 'treatment' | 'appointment' | 'file' | 'other'
  href?: string
  action?: () => void
  icon?: React.ReactNode
}

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  onClear?: () => void
  results?: SearchResult[]
  loading?: boolean
  showRecent?: boolean
  recentSearches?: string[]
  onRecentClick?: (search: string) => void
  onClearRecent?: () => void
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  autoFocus?: boolean
  disabled?: boolean
  debounceMs?: number
  shortcuts?: Array<{
    key: string
    label: string
    action: () => void
  }>
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Αναζήτηση...',
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  results = [],
  loading = false,
  showRecent = true,
  recentSearches = [],
  onRecentClick,
  onClearRecent,
  size = 'md',
  fullWidth = true,
  autoFocus = false,
  disabled = false,
  debounceMs = 300,
  shortcuts = []
}) => {
  const [internalValue, setInternalValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentlySearched, setRecentlySearched] = useState<string[]>(recentSearches)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const value = controlledValue !== undefined ? controlledValue : internalValue
  const hasValue = value.length > 0
  const hasResults = results.length > 0
  const showDropdown = isOpen && (hasResults || (showRecent && recentlySearched.length > 0 && !hasValue))

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)

    // Debounced search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      if (newValue.trim()) {
        onSearch?.(newValue.trim())
      }
    }, debounceMs)
  }

  // Handle search execution
  const executeSearch = (searchValue: string) => {
    if (!searchValue.trim()) return

    onSearch?.(searchValue.trim())
    
    // Add to recent searches
    if (!recentlySearched.includes(searchValue)) {
      const newRecent = [searchValue, ...recentlySearched].slice(0, 5)
      setRecentlySearched(newRecent)
    }
    
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle clear
  const handleClear = () => {
    const newValue = ''
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
    onClear?.()
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const totalItems = hasValue ? results.length : recentlySearched.length

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          if (hasValue && results[selectedIndex]) {
            const result = results[selectedIndex]
            if (result.action) {
              result.action()
            } else if (result.href) {
              window.location.href = result.href
            }
          } else if (!hasValue && recentlySearched[selectedIndex]) {
            const recent = recentlySearched[selectedIndex]
            handleInputChange(recent)
            onRecentClick?.(recent)
          }
        } else if (hasValue) {
          executeSearch(value)
        }
        break

      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : totalItems - 1
        )
        break

      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break

      case 'Tab':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }

    // Handle shortcuts
    if (e.metaKey || e.ctrlKey) {
      const shortcut = shortcuts.find(s => s.key === e.key)
      if (shortcut) {
        e.preventDefault()
        shortcut.action()
      }
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [results, value])

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5'
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return '👤'
      case 'treatment':
        return '🦷'
      case 'appointment':
        return '📅'
      case 'file':
        return '📄'
      default:
        return '🔍'
    }
  }

  return (
    <div 
      ref={containerRef}
      className={clsx(['relative', fullWidth && 'w-full'])}
    >
      {/* Input Container */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className={clsx([iconSizes[size], 'text-gray-400'])} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx([
            'block w-full pl-10 pr-10 border border-gray-300 rounded-lg',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'transition-all duration-200',
            sizeClasses[size]
          ])}
        />

        {/* Clear Button */}
        {hasValue && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className={iconSizes[size]} />
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-80 overflow-y-auto"
          >
            {hasValue ? (
              // Search Results
              <>
                {results.length > 0 ? (
                  <div>
                    <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Αποτελέσματα
                    </div>
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        className={clsx([
                          'w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3',
                          selectedIndex === index && 'bg-primary-50 text-primary-700'
                        ])}
                        onClick={() => {
                          if (result.action) {
                            result.action()
                          } else if (result.href) {
                            window.location.href = result.href
                          }
                          setIsOpen(false)
                        }}
                      >
                        <span className="text-lg">
                          {result.icon || getTypeIcon(result.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center text-gray-500">
                    <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Δεν βρέθηκαν αποτελέσματα</p>
                  </div>
                )}
              </>
            ) : (
              // Recent Searches
              showRecent && recentlySearched.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Πρόσφατες αναζητήσεις
                    </span>
                    {onClearRecent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearRecent}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Εκκαθάριση
                      </Button>
                    )}
                  </div>
                  {recentlySearched.map((search, index) => (
                    <button
                      key={search}
                      className={clsx([
                        'w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3',
                        selectedIndex === index && 'bg-primary-50 text-primary-700'
                      ])}
                      onClick={() => {
                        handleInputChange(search)
                        onRecentClick?.(search)
                        setIsOpen(false)
                      }}
                    >
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{search}</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Shortcuts */}
            {shortcuts.length > 0 && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Συντομεύσεις
                </div>
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.key}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => {
                      shortcut.action()
                      setIsOpen(false)
                    }}
                  >
                    <span className="text-sm text-gray-700">{shortcut.label}</span>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <CommandLineIcon className="h-3 w-3" />
                      <span>{shortcut.key}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchBar