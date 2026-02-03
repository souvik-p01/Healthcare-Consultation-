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
  Bell,
  Shield,
  Home,
  Activity
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const { user, userRole, logoutUser, loading } = useAppContext();
  const [userIconClick, setUserIconClick] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = !!user;
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleUserRole = () => {
    setUserIconClick(false);
    setDropdownOpen(false);
    
    if (userRole === 'patient') {
      navigate('/patient-portal');
      setShowNotification(true);
    } else if (userRole === 'doctor' || userRole === 'provider') {
      navigate('/doctor-portal');
      setShowNotification(true);
    } else if (userRole === 'admin') {
      navigate('/admin');
      setShowNotification(true);
    } else if (userRole === 'technician' || userRole === 'staff') {
      navigate('/technician-portal');
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
      setDropdownOpen(false);
      setShowNotification(false);
      navigate('/');
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const goToAdminPanel = () => {
    navigate('/admin');
    setDropdownOpen(false);
    setUserIconClick(false);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const goToProfile = () => {
    navigate('/complete-profile');
    setDropdownOpen(false);
    setUserIconClick(false);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  useEffect(() => {
    setUserIconClick(false);
    setDropdownOpen(false);
  }, [location]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
      if (userIconClick && !event.target.closest('.user-icon-area')) {
        setUserIconClick(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, userIconClick]);

  // Don't show header on admin routes
  if (isAdminRoute) {
    return null;
  }

  return (
    <header className="w-full flex justify-between bg-white shadow-lg sticky top-0 z-50">
      <nav className="py-4 w-full px-6 flex justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <NavLink 
            to="/" 
            onClick={() => setShowNotification(false)} 
            className="text-2xl font-bold text-gray-800"
          >
            HealthCare<span className="text-blue-600">Plus</span>
          </NavLink>
        </div>

        <div>
          <div className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `font-medium flex items-center gap-2 ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
              }
            >
              <Home className="w-4 h-4" />
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `font-medium flex items-center gap-2 ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
              }
            >
              <UserCheck className="w-4 h-4" />
              About
            </NavLink>
            <NavLink 
              to="/services" 
              className={({ isActive }) => 
                `font-medium flex items-center gap-2 ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
              }
            >
              <Stethoscope className="w-4 h-4" />
              Services
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                `font-medium flex items-center gap-2 ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
              }
            >
              <Activity className="w-4 h-4" />
              Contact
            </NavLink>

            {isLoggedIn && (
              <div className='relative'>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium text-gray-700">
                    {user?.firstName || 'User'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 user-dropdown">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      <span className={`inline-block px-2 py-1 mt-1 text-xs font-semibold rounded-full ${
                        userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                        userRole === 'doctor' || userRole === 'provider' ? 'bg-blue-100 text-blue-800' :
                        userRole === 'patient' ? 'bg-green-100 text-green-800' :
                        userRole === 'technician' || userRole === 'staff' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                      </span>
                    </div>

                    <button
                      onClick={handleUserRole}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Dashboard
                    </button>

                    <button
                      onClick={goToProfile}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <User className="w-4 h-4 mr-3" />
                      My Profile
                    </button>

                    {/* Show Admin Panel link only for admin users */}
                    {userRole === 'admin' && (
                      <button
                        onClick={goToAdminPanel}
                        className="flex items-center w-full px-4 py-2 text-purple-700 hover:bg-purple-50"
                      >
                        <Shield className="w-4 h-4 mr-3" />
                        Admin Panel
                      </button>
                    )}

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {loading ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isLoggedIn && (
              <button 
                onClick={() => {
                  navigate('/login', { state: { mode: 'login' } });
                  setIsMenuOpen(false);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                Login / Register
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden min-h-screen w-full absolute top-full left-0 right-0 bg-white border-t z-50 p-6">
            <div className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                Home
              </NavLink>
              <NavLink 
                to="/about" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <UserCheck className="w-5 h-5" />
                About Us
              </NavLink>
              <NavLink 
                to="/services" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <Stethoscope className="w-5 h-5" />
                Services
              </NavLink>
              <NavLink 
                to="/contact" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <Activity className="w-5 h-5" />
                Contact
              </NavLink>

              {isLoggedIn ? (
                <div className='flex flex-col gap-3 mt-4 pt-4 border-t'>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <span className={`inline-block px-2 py-1 mt-1 text-xs font-semibold rounded-full ${
                      userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                      userRole === 'doctor' || userRole === 'provider' ? 'bg-blue-100 text-blue-800' :
                      userRole === 'patient' ? 'bg-green-100 text-green-800' :
                      userRole === 'technician' || userRole === 'staff' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleUserRole}
                    className="px-4 py-3 bg-blue-600 text-white w-full rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Dashboard
                  </button>

                  <button
                    onClick={goToProfile}
                    className="px-4 py-3 bg-gray-100 text-gray-700 w-full rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>

                  {/* Show Admin Panel button only for admin users */}
                  {userRole === 'admin' && (
                    <button
                      onClick={goToAdminPanel}
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white w-full rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-3"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="px-4 py-3 bg-red-600 text-white w-full rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
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
                  className='px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white w-full rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3'
                >
                  <User className="w-5 h-5" />
                  Login / Register
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