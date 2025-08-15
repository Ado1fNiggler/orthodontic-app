import { useState, useRef, useEffect, Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import Button from './Button'

export interface DropdownOption {
  label: string
  value: string | number
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
  group?: string
  divider?: boolean
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string | number | (string | number)[]
  onChange?: (value: string | number | (string | number)[]) => void
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  disabled?: boolean
  loading?: boolean
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  clearable?: boolean
  maxHeight?: string
  position?: 'bottom' | 'top'
  align?: 'left' | 'right'
  triggerClassName?: string
  menuClassName?: string
  renderTrigger?: (props: {
    isOpen: boolean
    selectedOptions: DropdownOption[]
    placeholder: string
  }) => React.ReactNode
  renderOption?: (option: DropdownOption, selected: boolean) => React.ReactNode
}

const Dropdown: React.FC<DropdownProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Επιλογή...',
  multiple = false,
  searchable = false,
  disabled = false,
  loading = false,
  error = false,
  size = 'md',
  fullWidth = true,
  clearable = false,
  maxHeight = '16rem',
  position = 'bottom',
  align = 'left',
  triggerClassName,
  menuClassName,
  renderTrigger,
  renderOption
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Normalize value to array for easier handling
  const normalizedValue = Array.isArray(value) ? value : value ? [value] : []
  
  // Get selected options
  const selectedOptions = options.filter(option => 
    normalizedValue.includes(option.value)
  )

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // Group options if needed
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const group = option.group || 'default'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(option)
    return groups
  }, {} as Record<string, DropdownOption[]>)

  // Handle option selection
  const handleSelect = (selectedOption: DropdownOption) => {
    if (selectedOption.disabled) return

    let newValue: string | number | (string | number)[]

    if (multiple) {
      const currentValues = normalizedValue
      if (currentValues.includes(selectedOption.value)) {
        // Remove from selection
        newValue = currentValues.filter(v => v !== selectedOption.value)
      } else {
        // Add to selection
        newValue = [...currentValues, selectedOption.value]
      }
    } else {
      newValue = selectedOption.value
      setIsOpen(false)
    }

    onChange?.(newValue)
  }

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(multiple ? [] : '')
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, searchable])

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  // Render trigger button
  const renderTriggerButton = () => {
    if (renderTrigger) {
      return renderTrigger({ isOpen, selectedOptions, placeholder })
    }

    const displayText = selectedOptions.length > 0
      ? multiple
        ? selectedOptions.length === 1
          ? selectedOptions[0].label
          : `${selectedOptions.length} επιλεγμένα`
        : selectedOptions[0].label
      : placeholder

    return (
      <Button
        variant="outline"
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        className={clsx([
          'justify-between text-left',
          error && 'border-error-300 focus:ring-error-500',
          triggerClassName
        ])}
        rightIcon={
          loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : (
            <ChevronDownIcon className={clsx([
              iconSizes[size],
              'transition-transform duration-200',
              isOpen && 'rotate-180'
            ])} />
          )
        }
      >
        <span className={clsx([
          'truncate',
          selectedOptions.length === 0 && 'text-gray-500'
        ])}>
          {displayText}
        </span>
      </Button>
    )
  }

  // Render option item
  const renderOptionItem = (option: DropdownOption) => {
    const isSelected = normalizedValue.includes(option.value)

    if (renderOption) {
      return renderOption(option, isSelected)
    }

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {option.icon && (
            <span className={iconSizes[size]}>
              {option.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {option.label}
            </div>
            {option.description && (
              <div className="text-xs text-gray-500 truncate">
                {option.description}
              </div>
            )}
          </div>
        </div>
        
        {multiple && isSelected && (
          <CheckIcon className="h-4 w-4 text-primary-600" />
        )}
      </div>
    )
  }

  return (
    <Menu as="div" className={clsx(['relative', fullWidth && 'w-full'])}>
      {({ open }) => {
        // Sync internal state with headless ui state
        if (open !== isOpen) {
          setIsOpen(open)
        }

        return (
          <>
            <Menu.Button as="div" className="w-full">
              {renderTriggerButton()}
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={clsx([
                  'absolute z-50 w-full bg-white shadow-lg rounded-lg border border-gray-200 py-1 focus:outline-none',
                  position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
                  align === 'right' && 'right-0',
                  menuClassName
                ])}
                style={{ maxHeight }}
              >
                <div className="overflow-y-auto" style={{ maxHeight }}>
                  {/* Search Input */}
                  {searchable && (
                    <div className="px-2 py-1 border-b border-gray-100">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Αναζήτηση..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full px-2 py-1 text-sm border-0 focus:ring-0 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Clear Option */}
                  {clearable && selectedOptions.length > 0 && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={clsx([
                            'w-full px-3 py-2 text-left text-sm border-b border-gray-100',
                            active ? 'bg-gray-50' : '',
                            'text-gray-500 hover:text-gray-700'
                          ])}
                          onClick={handleClear}
                        >
                          Εκκαθάριση επιλογής
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {/* Options */}
                  {Object.keys(groupedOptions).length > 0 ? (
                    Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                      <div key={groupName}>
                        {/* Group Header */}
                        {groupName !== 'default' && (
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            {groupName}
                          </div>
                        )}
                        
                        {/* Group Options */}
                        {groupOptions.map((option, index) => (
                          <Fragment key={option.value}>
                            {/* Divider */}
                            {option.divider && index > 0 && (
                              <div className="border-t border-gray-100 my-1" />
                            )}
                            
                            <Menu.Item disabled={option.disabled}>
                              {({ active, disabled: itemDisabled }) => (
                                <button
                                  className={clsx([
                                    'w-full px-3 py-2 text-left transition-colors duration-150',
                                    active && !itemDisabled ? 'bg-primary-50 text-primary-700' : '',
                                    itemDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900',
                                    normalizedValue.includes(option.value) && !multiple && 'bg-primary-50 text-primary-700 font-medium'
                                  ])}
                                  onClick={() => handleSelect(option)}
                                  disabled={itemDisabled}
                                >
                                  {renderOptionItem(option)}
                                </button>
                              )}
                            </Menu.Item>
                          </Fragment>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-gray-500">
                      <div className="text-sm">
                        {searchQuery ? 'Δεν βρέθηκαν αποτελέσματα' : 'Δεν υπάρχουν επιλογές'}
                      </div>
                    </div>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </>
        )
      }}
    </Menu>
  )
}

// Predefined dropdown variants
export const SelectDropdown: React.FC<Omit<DropdownProps, 'multiple'>> = (props) => (
  <Dropdown {...props} multiple={false} />
)

export const MultiSelectDropdown: React.FC<Omit<DropdownProps, 'multiple'>> = (props) => (
  <Dropdown {...props} multiple={true} />
)

export const SearchableDropdown: React.FC<Omit<DropdownProps, 'searchable'>> = (props) => (
  <Dropdown {...props} searchable={true} />
)

// Utility function to create options
export const createDropdownOptions = (
  items: Array<{
    label: string
    value: string | number
    [key: string]: any
  }>
): DropdownOption[] => {
  return items.map(item => ({
    label: item.label,
    value: item.value,
    ...item
  }))
}

export default Dropdown