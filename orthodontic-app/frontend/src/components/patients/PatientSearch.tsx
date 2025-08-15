import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from 'react-query'
import {
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Components
import SearchBar from '@components/common/SearchBar'
import Card, { CardBody } from '@components/common/Card'
import Button from '@components/common/Button'
import LoadingSpinner from '@components/common/LoadingSpinner'

// API & Types
import { patientApi } from '@api/patientApi'
import { Patient } from '@types/patient'

interface SearchResult extends Patient {
  highlightedFields?: string[]
  matchScore?: number
}

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void
  placeholder?: string
  showRecentSearches?: boolean
  maxResults?: number
  className?: string
  compact?: boolean
}

const PatientSearch: React.FC<PatientSearchProps> = ({
  onPatientSelect,
  placeholder = 'Αναζήτηση ασθενών (όνομα, τηλέφωνο, email)...',
  showRecentSearches = true,
  maxResults = 10,
  className,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('patient-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading recent searches:', error)
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim() || recentSearches.includes(query)) return
    
    const newRecent = [query, ...recentSearches].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('patient-recent-searches', JSON.stringify(newRecent))
  }

  // Search API query
  const { 
    data: searchResults, 
    isLoading, 
    error 
  } = useQuery(
    ['patient-search', searchQuery],
    () => patientApi.searchPatients(searchQuery, { limit: maxResults }),
    {
      enabled: searchQuery.length >= 2,
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000 // 5 minutes
    }
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSelectedIndex(-1)
    setIsOpen(value.length >= 2 || (value.length === 0 && showRecentSearches))
  }

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient)
    saveRecentSearch(searchQuery)
    setSearchQuery('')
    setIsOpen(false)
    searchInputRef.current?.blur()
  }

  // Handle recent search selection
  const handleRecentSearch = (query: string) => {
    setSearchQuery(query)
    setIsOpen(true)
  }

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('patient-recent-searches')
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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const results = searchResults?.data || []
    const totalItems = searchQuery.length >= 2 ? results.length : recentSearches.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : 0)
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : totalItems - 1)
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (searchQuery.length >= 2 && results[selectedIndex]) {
            handlePatientSelect(results[selectedIndex])
          } else if (searchQuery.length < 2 && recentSearches[selectedIndex]) {
            handleRecentSearch(recentSearches[selectedIndex])
          }
        }
        break
      
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const hasResults = searchResults?.data && searchResults.data.length > 0
  const showDropdown = isOpen && (
    (searchQuery.length >= 2 && (hasResults || isLoading || error)) ||
    (searchQuery.length < 2 && showRecentSearches && recentSearches.length > 0)
  )

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
            ${compact ? 'text-sm py-1.5' : 'text-sm py-2'}
          `}
        />
        
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setIsOpen(false)
              searchInputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
          >
            {searchQuery.length >= 2 ? (
              // Search Results
              <>
                {isLoading && (
                  <div className="p-4 text-center">
                    <LoadingSpinner size="sm" />
                    <p className="text-sm text-gray-500 mt-2">Αναζήτηση...</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 text-center text-red-600">
                    <p className="text-sm">Σφάλμα κατά την αναζήτηση</p>
                  </div>
                )}

                {hasResults && (
                  <>
                    <div className="px-3 py-2 border-b border-gray-100">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Αποτελέσματα ({searchResults.data.length})
                      </span>
                    </div>
                    
                    {searchResults.data.map((patient, index) => (
                      <button
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className={`
                          w-full p-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0
                          transition-colors duration-150
                          ${selectedIndex === index ? 'bg-primary-50 text-primary-700' : ''}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {patient.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={patient.avatar}
                                alt={patient.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                          </div>

                          {/* Patient Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {highlightText(patient.name, searchQuery)}
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-1">
                              {calculateAge(patient.birthDate)} ετών • {patient.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'}
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-xs text-gray-500">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {highlightText(patient.phone, searchQuery)}
                              </div>
                              
                              <div className="flex items-center text-xs text-gray-500">
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                {highlightText(patient.email, searchQuery)}
                              </div>
                            </div>

                            {patient.lastVisit && (
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <CalendarDaysIcon className="h-3 w-3 mr-1" />
                                Τελευταία επίσκεψη: {new Date(patient.lastVisit).toLocaleDateString('el-GR')}
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            <span className={`
                              inline-flex px-2 py-1 text-xs font-medium rounded-full
                              ${patient.status === 'active' ? 'bg-green-100 text-green-800' :
                                patient.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'}
                            `}>
                              {patient.status === 'active' ? 'Ενεργός' :
                               patient.status === 'inactive' ? 'Ανενεργός' : 'Αρχειοθετημένος'}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {!isLoading && !error && !hasResults && (
                  <div className="p-6 text-center text-gray-500">
                    <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">Δεν βρέθηκαν ασθενείς</p>
                    <p className="text-xs mt-1">Δοκιμάστε διαφορετικούς όρους αναζήτησης</p>
                  </div>
                )}
              </>
            ) : (
              // Recent Searches
              showRecentSearches && recentSearches.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Πρόσφατες αναζητήσεις
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Εκκαθάριση
                    </Button>
                  </div>
                  
                  {recentSearches.map((search, index) => (
                    <button
                      key={search}
                      onClick={() => handleRecentSearch(search)}
                      className={`
                        w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700
                        transition-colors duration-150
                        ${selectedIndex === index ? 'bg-primary-50 text-primary-700' : ''}
                      `}
                    >
                      <div className="flex items-center">
                        <MagnifyingGlassIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {search}
                      </div>
                    </button>
                  ))}
                </>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PatientSearch