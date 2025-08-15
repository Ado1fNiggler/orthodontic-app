import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  UserGroupIcon,
  CameraIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  CogIcon,
  BeakerIcon,
  FolderIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  CameraIcon as CameraSolidIcon,
  CalendarDaysIcon as CalendarSolidIcon,
  CurrencyEuroIcon as CurrencyEuroSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  CogIcon as CogSolidIcon,
  BeakerIcon as BeakerSolidIcon,
  FolderIcon as FolderSolidIcon,
  DocumentTextIcon as DocumentTextSolidIcon
} from '@heroicons/react/24/solid'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  iconSolid: React.ComponentType<any>
  badge?: string | number
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeSolidIcon
  },
  {
    name: 'Ασθενείς',
    href: '/patients',
    icon: UserGroupIcon,
    iconSolid: UserGroupSolidIcon,
    badge: '24'
  },
  {
    name: 'Θεραπείες',
    href: '/treatments',
    icon: BeakerIcon,
    iconSolid: BeakerSolidIcon,
    children: [
      { name: 'Ενεργές Θεραπείες', href: '/treatments/active', icon: BeakerIcon, iconSolid: BeakerSolidIcon },
      { name: 'Ολοκληρωμένες', href: '/treatments/completed', icon: BeakerIcon, iconSolid: BeakerSolidIcon },
      { name: 'Σχέδια Θεραπείας', href: '/treatments/plans', icon: BeakerIcon, iconSolid: BeakerSolidIcon }
    ]
  },
  {
    name: 'Φωτογραφίες',
    href: '/photos',
    icon: CameraIcon,
    iconSolid: CameraSolidIcon
  },
  {
    name: 'Ημερολόγιο',
    href: '/calendar',
    icon: CalendarDaysIcon,
    iconSolid: CalendarSolidIcon,
    badge: '3'
  },
  {
    name: 'Οικονομικά',
    href: '/financial',
    icon: CurrencyEuroIcon,
    iconSolid: CurrencyEuroSolidIcon,
    children: [
      { name: 'Πληρωμές', href: '/financial/payments', icon: CurrencyEuroIcon, iconSolid: CurrencyEuroSolidIcon },
      { name: 'Δόσεις', href: '/financial/installments', icon: CurrencyEuroIcon, iconSolid: CurrencyEuroSolidIcon },
      { name: 'Αποδείξεις', href: '/financial/receipts', icon: DocumentTextIcon, iconSolid: DocumentTextSolidIcon }
    ]
  },
  {
    name: 'Αναφορές',
    href: '/reports',
    icon: ChartBarIcon,
    iconSolid: ChartBarSolidIcon
  },
  {
    name: 'Αρχεία',
    href: '/files',
    icon: FolderIcon,
    iconSolid: FolderSolidIcon
  },
  {
    name: 'Ρυθμίσεις',
    href: '/settings',
    icon: CogIcon,
    iconSolid: CogSolidIcon
  }
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const isParentActive = (item: NavigationItem) => {
    if (isActiveRoute(item.href)) return true
    if (item.children) {
      return item.children.some(child => isActiveRoute(child.href))
    }
    return false
  }

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: isMobile ? -320 : 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2
      }
    },
    closed: {
      opacity: isCollapsed ? 0 : 1,
      x: isCollapsed ? -20 : 0,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <>
      <motion.div
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-strong border-r border-gray-200 ${
          isMobile ? 'w-80' : isCollapsed ? 'w-16' : 'w-64'
        } ${isMobile ? '' : 'lg:static'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          {(!isCollapsed || isMobile) && (
            <motion.div
              variants={itemVariants}
              animate={isOpen ? "open" : "closed"}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">OrthoApp</h2>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}

            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item, index) => {
            const isActive = isParentActive(item)
            const isExpanded = expandedItems.includes(item.name)
            const hasChildren = item.children && item.children.length > 0

            return (
              <div key={item.name}>
                {/* Main Item */}
                <div className="relative">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        {isActive ? (
                          <item.iconSolid className="flex-shrink-0 h-5 w-5 mr-3" />
                        ) : (
                          <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                        )}
                        
                        {(!isCollapsed || isMobile) && (
                          <motion.span
                            variants={itemVariants}
                            animate={isOpen ? "open" : "closed"}
                            className="truncate"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </div>

                      {(!isCollapsed || isMobile) && (
                        <motion.div
                          variants={itemVariants}
                          animate={isOpen ? "open" : "closed"}
                          className="flex items-center space-x-2"
                        >
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              isActive 
                                ? 'bg-primary-100 text-primary-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          
                          <motion.svg
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </motion.svg>
                        </motion.div>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {isActive ? (
                        <item.iconSolid className="flex-shrink-0 h-5 w-5 mr-3" />
                      ) : (
                        <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                      )}
                      
                      {(!isCollapsed || isMobile) && (
                        <motion.div
                          variants={itemVariants}
                          animate={isOpen ? "open" : "closed"}
                          className="flex items-center justify-between w-full"
                        >
                          <span className="truncate">{item.name}</span>
                          
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              isActive 
                                ? 'bg-primary-100 text-primary-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </Link>
                  )}

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>

                {/* Children */}
                <AnimatePresence>
                  {hasChildren && isExpanded && (!isCollapsed || isMobile) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-8 mt-1 space-y-1 overflow-hidden"
                    >
                      {item.children?.map((child) => {
                        const isChildActive = isActiveRoute(child.href)
                        
                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={isMobile ? onClose : undefined}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                              isChildActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        {(!isCollapsed || isMobile) && (
          <motion.div
            variants={itemVariants}
            animate={isOpen ? "open" : "closed"}
            className="p-4 border-t border-gray-200"
          >
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Συνδεδεμένο</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  )
}

export default Sidebar