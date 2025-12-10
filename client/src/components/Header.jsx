import React, { useContext, useEffect, useState } from 'react';
import { 
  Heart, 
  ChevronDown,
  Menu,
  X,
  UserCheck,
  Stethoscope,
  Settings,
  User,
  LogOut,
  Bell
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const { user, userRole, logoutUser, loading } = useAppContext();
  const [userIconClick, setUserIconClick] = useState(false);
  const location = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!user;

  const handleUserRole = () => {
    setUserIconClick(false);
    
    if (userRole === 'patient') {
      navigate('/patient-portal');
      setShowNotification(true);
    } else if (userRole === 'doctor') {
      navigate('/doctor-portal');
      setShowNotification(true);
    } else if (userRole === 'admin') {
      navigate('/admin-dashboard');
      setShowNotification(true);
    } else {
      navigate('/dashboard');
      setShowNotification(true);
    }
    
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserIconClick(false);
      setShowNotification(false);
      navigate('/');
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    setUserIconClick(false);
  }, [location]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userIconClick && !event.target.closest('.user-dropdown')) {
        setUserIconClick(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userIconClick]);

  return (
    <header className="w-full flex justify-between bg-white shadow-lg sticky top-0 z-50">
      <nav className="py-4 w-full px-6 flex justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <NavLink to="/" onClick={() => setShowNotification(false)} className="text-2xl font-bold text-gray-800">
            HealthCare<span className="text-blue-600">Plus</span>
          </NavLink>
        </div>

        <div>
          <div className="hidden md:flex items-center space-x-8">
            {!showNotification ? (
              <>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `font-medium ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => 
                    `font-medium ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  About
                </NavLink>
                <NavLink 
                  to="/services" 
                  className={({ isActive }) => 
                    `font-medium ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Services
                </NavLink>

                <NavLink 
                  to="/contact" 
                  className={({ isActive }) => 
                    `font-medium ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Contact
                </NavLink>
              </>
            ) : (
              <div>
                <Bell className="w-6 h-6 cursor-pointer" />  
              </div>
            )}

            {isLoggedIn ? (
              <div className='relative p-1 w-[30px] h-[30px] border cursor-pointer rounded-full flex items-center justify-center user-dropdown' onClick={() => setUserIconClick(!userIconClick)}>
                <User className='w-full h-full' />
                <div
                  className={`absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border z-50 flex-col text-gray-700 user-dropdown ${userIconClick ? 'flex' : 'hidden'}`}
                >
                  <div className="px-4 py-2 border-b bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                  <button
                    onClick={handleUserRole}
                    className="px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" /> Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="px-4 py-2 flex items-center gap-2 text-left hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" /> 
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  navigate('/login', { state: { mode: 'login' } });
                  setIsMenuOpen(false);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg w-fit"
              >
                Login
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden min-h-screen w-full absolute top-full left-0 right-0 bg-white border-t z-50 p-6">
            <div className="flex flex-col space-y-2">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'} py-2`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink 
                to="/about" 
                className={({ isActive }) => 
                  `${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'} py-2`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </NavLink>
              <NavLink 
                to="/services" 
                className={({ isActive }) => 
                  `${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'} py-2`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </NavLink>

              <NavLink 
                to="/contact" 
                className={({ isActive }) => 
                  `${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'} py-2`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </NavLink>

              {isLoggedIn ? (
                <div className='flex flex-col gap-3 mt-4'>
                  <div className="px-4 py-2 bg-gray-100 rounded-md">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                  <button
                    onClick={handleUserRole}
                    className="px-4 py-2 bg-blue-600 text-white w-full cursor-pointer rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white w-full cursor-pointer rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" /> 
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
                ) : (
                <button 
                  onClick={() => {
                    navigate('/login', { state: { mode: 'login' } });
                    setIsMenuOpen(false);
                  }}
                  className='px-3 py-2 bg-[#155DFC] w-full cursor-pointer rounded-md flex items-center justify-center text-white'
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;