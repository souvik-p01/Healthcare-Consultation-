import React from 'react'
import { NavLink } from 'react-router-dom'
import { Brain, Home } from 'lucide-react'

const Navigation = () => {
  const navItems = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/services', label: 'Services', icon: <Brain className="w-4 h-4" /> },
    { path: '/ai-assistant', label: 'AI Assistant' },
    { path: '/consultations', label: 'Consultations' },
    { path: '/emergency', label: 'Emergency' },
    { path: '/pharmacy', label: 'Pharmacy' },
    { path: '/monitoring', label: 'Monitoring' },
    { path: '/records', label: 'Records' }
  ]

  return (
    <nav className="bg-white shadow-md border-t sticky top-[64px] z-40">
      {/* This sits BELOW Header.jsx */}
      <div className="container mx-auto px-4">
        <div className="flex justify-center md:justify-start items-center h-14 overflow-x-auto">
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
