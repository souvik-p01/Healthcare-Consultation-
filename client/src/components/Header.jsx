import React, { useContext, useState } from 'react';
import { 
  Heart, 
  ChevronDown,
  Menu,
  X,
  UserCheck,
  Stethoscope,
  Settings,
  User
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const navigate = useNavigate();
  const {showLogin} = useContext(AppContext)

  return (
    <header className="w-full flex justify-between bg-white shadow-lg sticky top-0 z-50">
      <nav className="py-4 w-full px-6 flex justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <NavLink to="/" className="text-2xl font-bold text-gray-800">
            HealthCare<span className="text-blue-600">Plus</span>
          </NavLink>
        </div>

        <div>
          <div className="hidden md:flex items-center space-x-8">
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
            
            <div className="relative">
              <button 
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center text-gray-700 hover:text-blue-600 font-medium"
              >
                User Roles <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                  <NavLink 
                    to="/patient-portal" 
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 hover:bg-blue-50 hover:text-blue-600 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`
                    }
                    onClick={() => setShowRoleDropdown(false)}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Patient Portal
                  </NavLink>
                  <NavLink 
                    to="/doctor-portal" 
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 hover:bg-blue-50 hover:text-blue-600 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`
                    }
                    onClick={() => setShowRoleDropdown(false)}
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Doctor Portal
                  </NavLink>
                  <NavLink 
                    to="/technician-portal" 
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 hover:bg-blue-50 hover:text-blue-600 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`
                    }
                    onClick={() => setShowRoleDropdown(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Technician Portal
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                `font-medium ${isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`
              }
            >
              Contact
            </NavLink>

            {showLogin ? (
              <div className='p-1 w-[30px] h-[30px] border cursor-pointer rounded-full flex items-center justify-center'>
                <User className='w-full h-full' />
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
              
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center justify-between w-full text-gray-700 hover:text-blue-600 py-2"
                >
                  User Roles <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {showRoleDropdown && (
                  <div className="mt-2 w-full z-50">
                    <NavLink 
                      to="/patient-portal" 
                      className={({ isActive }) => 
                        `flex items-center px-4 py-3 hover:bg-blue-50 hover:text-blue-600 ${
                          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`
                      }
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Patient Portal
                    </NavLink>
                    <NavLink 
                      to="/doctor-portal" 
                      className={({ isActive }) => 
                        `flex items-center px-4 py-3 hover:bg-blue-50 hover:text-blue-600 ${
                          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`
                      }
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Doctor Portal
                    </NavLink>
                    <NavLink 
                      to="/technician-portal" 
                      className={({ isActive }) => 
                        `flex items-center px-4 py-3 hover:bg-blue-50 hover:text-blue-600 ${
                          isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`
                      }
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Technician Portal
                    </NavLink>
                  </div>
                )}
              </div>

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
                <div className='px-3 py-2 bg-[#155DFC] w-full cursor-pointer rounded-md flex items-center justify-center text-white'>
                  <span>Dashboard</span>
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