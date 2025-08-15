import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  UserGroupIcon,
  CameraIcon,
  CalendarDaysIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  CameraIcon as CameraSolidIcon,
  CalendarDaysIcon as CalendarSolidIcon,
  ChartBarIcon as ChartBarSolidIcon
} from '@heroicons/react/24/solid'

interface MobileNavProps {
  currentPath: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  iconSolid: React.ComponentType<any>
  badge?: number
}

const navItems: NavItem[] = [
  {
    name: 'Αρχική',
    href: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeSolidIcon
  },
  {
    name: 'Ασθενείς',
    href: '/patients',
    icon: UserGroupIcon,
    iconSolid: UserGroupSolidIcon,
    badge: 24
  },
  {
    name: 'Κάμερα',
    href: '/camera',
    icon: CameraIcon,
    iconSolid: CameraSolidIcon
  },
  {
    name: 'Ραντεβού',
    href: '/calendar',
    icon: CalendarDaysIcon,
    iconSolid: CalendarSolidIcon,
    badge: 3
  },
  {
    name: 'Αναφορές',
    href: '/reports',
    icon: ChartBarIcon,
    iconSolid: ChartBarSolidIcon
  }
]

const MobileNav: React.FC<MobileNavProps> = ({ currentPath }) => {
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === href
    }
    return currentPath.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <nav className="flex items-center justify-around">
        {navItems.map((item, index) => {
          const isActive = isActiveRoute(item.href)
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all duration-200 relative"
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute inset-0 bg-primary-50 rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Icon */}
              <div className="relative z-10">
                {isActive ? (
                  <item.iconSolid className={`h-6 w-6 ${
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                ) : (
                  <item.icon className={`h-6 w-6 ${
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                )}
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium relative z-10 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {item.name}
              </span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bottom-0 w-1 h-1 bg-primary-600 rounded-full"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileNav