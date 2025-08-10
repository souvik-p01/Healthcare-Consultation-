import React, { useState } from 'react';
import { 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  Shield, 
  Stethoscope, 
  Activity, 
  Ambulance,
  Pill,
  Brain,
  UserCheck,
  Settings,
  ChevronDown,
  Menu,
  X,
  Play,
  CheckCircle
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

// Header Component
const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  return (
    <header className="w-full flex justify-between bg-white shadow-lg sticky top-0 z-50">

        {/* Main Navigation */}
        <nav className="py-4 w-full px-6 flex justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">HealthCare<span className="text-blue-600">Plus</span></span>
            </div>

            <div>
              <div className="hidden md:flex items-center space-x-8">
                <NavLink to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                  Home
                </NavLink>
                <NavLink to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
                  About
                </NavLink>
                <NavLink to="/services" className="text-gray-700 hover:text-blue-600 font-medium">
                  Services
                </NavLink>
                
                {/* Role Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="flex items-center text-gray-700 hover:text-blue-600 font-medium"
                  >
                    User Roles <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showRoleDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <a href="#patient" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Patient Portal
                      </a>
                      <a href="#doctor" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Doctor Portal
                      </a>
                      <a href="#technician" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                        <Settings className="w-4 h-4 mr-2" />
                        Technician Portal
                      </a>
                    </div>
                  )}
                </div>

                <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Login
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>


          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t">
              <div className="flex flex-col space-y-3 pt-4">
                <a href="#home" className="text-gray-700 hover:text-blue-600">Home</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600">About Us</a>
                <a href="#services" className="text-gray-700 hover:text-blue-600">Services</a>
                <a href="#patient" className="text-gray-700 hover:text-blue-600 pl-4">- Patient Portal</a>
                <a href="#doctor" className="text-gray-700 hover:text-blue-600 pl-4">- Doctor Portal</a>
                <a href="#technician" className="text-gray-700 hover:text-blue-600 pl-4">- Technician Portal</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600">Contact</a>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg w-fit">Login</button>
              </div>
            </div>
          )}
        </nav>
    </header>
  );
};
export default Header;