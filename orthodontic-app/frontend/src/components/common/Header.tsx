import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  CameraIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import SearchBar from './SearchBar'
import Button from './Button'

interface HeaderProps {
  onMenuClick: () => void
  pageTitle: string
  user: any
  notificationCount?: number
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  pageTitle, 
  user, 
  notificationCount = 0 
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore()
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)
  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </Button>

            {/* Desktop Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="hidden lg:flex"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-5 w-5" />
            </Button>

            {/* Page Title */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-900">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <SearchBar
              placeholder="Αναζήτηση ασθενών, θεραπειών..."
              onSearch={(query) => {
                navigate(`/search?q=${encodeURIComponent(query)}`)
              }}
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </Button>

            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* Add Patient Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/patients/new')}
                className="text-gray-600 hover:text-primary-600"
                aria-label="Add patient"
              >
                <PlusIcon className="h-5 w-5" />
              </Button>

              {/* Camera Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/camera')}
                className="text-gray-600 hover:text-primary-600"
                aria-label="Take photo"
              >
                <CameraIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
                aria-label={`Notifications ${notificationCount > 0 ? `(${notificationCount} unread)` : ''}`}
              >
                <BellIcon className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-strong border border-gray-200 py-2 z-50"
                  >
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Ειδοποιήσεις
                      </h3>
                      {unreadNotifications.length > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Σήμανση όλων
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-64 overflow-y-auto">
                      {recentNotifications.length > 0 ? (
                        recentNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                              notification.read 
                                ? 'border-transparent' 
                                : 'border-primary-500 bg-primary-50'
                            }`}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id)
                              }
                              if (notification.link) {
                                navigate(notification.link)
                              }
                              setShowNotifications(false)
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.read ? 'bg-gray-300' : 'bg-primary-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.timestamp}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Δεν υπάρχουν ειδοποιήσεις</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <Link
                          to="/notifications"
                          className="text-xs text-primary-600 hover:text-primary-700"
                          onClick={() => setShowNotifications(false)}
                        >
                          Προβολή όλων των ειδοποιήσεων
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
                <span className="hidden lg:block text-sm font-medium text-gray-700">
                  {user?.name || 'Χρήστης'}
                </span>
              </Button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-strong border border-gray-200 py-2 z-50"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'Χρήστης'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user?.email || 'user@example.com'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {user?.role || 'Ορθοδοντικός'}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircleIcon className="h-4 w-4 mr-3" />
                        Προφίλ
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <CogIcon className="h-4 w-4 mr-3" />
                        Ρυθμίσεις
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Αποσύνδεση
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 py-3"
            >
              <SearchBar
                placeholder="Αναζήτηση..."
                onSearch={(query) => {
                  navigate(`/search?q=${encodeURIComponent(query)}`)
                  setShowSearch(false)
                }}
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header