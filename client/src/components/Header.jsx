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
import { AppContext } from '../context/AppContext';
import { tr } from 'framer-motion/client';

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const {showLogin, userRole} = useContext(AppContext)
  const [userIconClick, setUserIconClick] = useState(false)
  const location = useLocation()
  const [showNotification, setShowNotification] = useState(false)

  const handleUserRole = () => {
    if(userRole === 'Patient'){
      navigate('/patient-portal')
      setShowNotification(true)
    }
    else if(userRole === 'Doctor'){
      navigate('/doctor-portal')
      setShowNotification(true)
    }
    else if(userRole === 'Technician'){
      navigate('/technician-portal')
      setShowNotification(true)
    }
    else return null;

    if(userRole === 'Patient' && isMenuOpen){
      navigate('/patient-portal')
      setShowNotification(true)
      setIsMenuOpen(false)
    }
    else if(userRole === 'Doctor' && isMenuOpen){
      navigate('/doctor-portal')
      setShowNotification(true)
      setIsMenuOpen(false)
    }
    else if(userRole === 'Technician' && isMenuOpen){
      navigate('/technician-portal')
      setShowNotification(true)
      setIsMenuOpen(false)
    }
    else return null;
  }

  useEffect(() => {
    setUserIconClick(false)
  }, [location])

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

            {showLogin ? (
              <div className='relative p-1 w-[30px] h-[30px] border cursor-pointer rounded-full flex items-center justify-center' onClick={() => setUserIconClick(true)}>
                <User className='w-full h-full' />
                <div
                  className={`absolute top-full right-0 mt-2 w-40 bg-white z-99 flex-col text-gray-700 ${userIconClick ? 'flex' : 'hidden'}`}
                >
                  <button
                    onClick={handleUserRole}
                    className="px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-600"
                  >
                    Dashboard
                  </button>
                  <button
                    className="px-4 py-2 flex items-center gap-2 text-left hover:bg-blue-50 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4" /> Logout
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

              {showLogin ? (
                <div className='flex flex-col gap-5 items-center justify-center text-white'>
                  <button
                    onClick={handleUserRole}
                    className="px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-600 bg-[#155DFC] w-full cursor-pointer rounded-md "
                  >
                    Dashboard
                  </button>
                  <button
                    className="bg-[#155DFC] w-full cursor-pointer rounded-md px-4 py-2 flex items-center gap-2 text-left hover:bg-blue-50 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4" /> Logout
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