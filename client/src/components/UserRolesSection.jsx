import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  UserCheck,
  Stethoscope,
  Settings,
  CheckCircle,
  Lock,
  AlertCircle,
  Shield,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const UserRolesSection = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const { userRole, user } = useContext(AppContext);
  const [mappedRole, setMappedRole] = useState(''); 
  
  // Map backend roles to portal roles
  useEffect(() => {
    if (userRole) {
      const roleMap = {
        'patient': 'Patient',
        'doctor': 'Doctor', 
        'nurse': 'Doctor',
        'technician': 'Technician',
        'staff': 'Technician',
        'admin': 'Admin'
      };
      
      const portalRole = roleMap[userRole.toLowerCase()] || 'Patient';
      setMappedRole(portalRole);
    } else {
      setMappedRole('');
    }
  }, [userRole]);

  const roles = [
    {
      title: "Patient Portal",
      backendRoles: ['patient'],
      icon: <UserCheck className="w-8 h-8 sm:w-10 md:w-12" />,
      features: [
        "AI symptom checker and health advice",
        "Book appointments with specialists",
        "Access medical records and reports",
        "Telemedicine consultations",
        "Pharmacy and medicine ordering",
        "Emergency ambulance booking"
      ],
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      path: "/patient-portal",
      delay: 0
    },
    {
      title: "Doctor Portal",
      backendRoles: ['doctor', 'nurse'],
      icon: <Stethoscope className="w-8 h-8 sm:w-10 md:w-12" />,
      features: [
        "Manage patient appointments",
        "Conduct video consultations",
        "Access patient medical history",
        "AI-assisted diagnosis tools",
        "Prescription management",
        "Patient communication system"
      ],
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      path: "/doctor-portal",
      delay: 100
    },
    {
      title: "Technician Portal",
      backendRoles: ['technician', 'staff'],
      icon: <Activity className="w-8 h-8 sm:w-10 md:w-12" />,
      features: [
        "Manage lab test schedules",
        "Upload and analyze reports",
        "Equipment maintenance tracking",
        "Quality control monitoring",
        "Patient sample management",
        "Integration with AI analysis"
      ],
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      path: "/technician-portal",
      delay: 200
    },
    {
      title: "Admin Portal",
      backendRoles: ['admin'],
      icon: <Shield className="w-8 h-8 sm:w-10 md:w-12" />,
      features: [
        "Manage system users",
        "View system analytics",
        "Configure platform settings",
        "Monitor platform performance",
        "Manage roles and permissions",
        "Generate system reports"
      ],
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      bgGradient: "from-red-50 to-red-100",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      path: "/admin-portal",
      delay: 300
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check if user can access a portal based on rules
  const canAccessPortal = (portalRoles) => {
    if (!userRole) return false;
    
    const normalizedUserRole = userRole.toLowerCase();
    
    // Admin has access to all portals
    if (normalizedUserRole === 'admin') {
      return true;
    }
    
    // Other roles only have access to their specific portal
    return portalRoles.includes(normalizedUserRole);
  };

  const handlePortalAccess = (path, title) => {
    // Add smooth transition
    const body = document.body;
    body.style.opacity = '0.95';
    body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      navigate(path);
      setTimeout(() => {
        body.style.opacity = '1';
      }, 100);
    }, 300);
  };

  // If no user role, show login prompt
  if (!userRole) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 sm:mb-8 flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Access Your Healthcare Portal
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
              Sign in to access your personalized healthcare portal with features tailored to your role.
            </p>
            
            {/* Show all locked portals when not logged in */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {roles.map((role, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-2 border-gray-200"
                >
                  <div className="bg-gray-100 text-gray-400 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    {role.icon}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    {role.title}
                  </h4>
                  <div className="flex items-center justify-center text-xs text-gray-500">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              Sign In to Continue
            </button>
            
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
              Don't have an account? <button onClick={() => navigate('/register')} className="text-blue-600 hover:text-blue-700 font-medium">Register here</button>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4 sm:mb-6 shadow-lg">
            <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 transform transition-all duration-1000 ease-out px-4"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            Welcome, {user?.firstName || 'User'}!
          </h2>
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full font-medium mb-3 sm:mb-4 shadow-sm">
            <span className="flex items-center text-sm sm:text-base">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              {mappedRole} Portal Access
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            {mappedRole === 'Admin' 
              ? 'You have full access to all portals with administrative privileges.'
              : 'Access your personalized healthcare portal with features tailored to your role.'}
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {roles.map((role, index) => {
            const hasAccess = canAccessPortal(role.backendRoles);
            const isPrimary = mappedRole === role.title.replace(" Portal", "");
            
            return (
              <div 
                key={index} 
                className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-500 ease-out transform hover:-translate-y-1 ${
                  hasAccess 
                    ? 'bg-white shadow-lg hover:shadow-xl border-2 border-gray-100' 
                    : 'bg-gray-50 shadow-sm border-2 border-gray-200 opacity-60'
                } ${isPrimary ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
                  transition: `all 0.6s ease-out ${role.delay}ms`
                }}
              >
                {/* Role Icon */}
                <div className={`${hasAccess ? role.iconBg : 'bg-gray-200'} ${hasAccess ? role.iconColor : 'text-gray-400'} w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto transform transition-all duration-300 ease-out ${hasAccess ? 'hover:scale-110' : ''}`}>
                  {role.icon}
                </div>
                
                {/* Role Title */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2">
                  {role.title}
                </h3>
                
                {/* Access Badge */}
                <div className={`text-center mb-3 sm:mb-4 ${
                  hasAccess ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    hasAccess ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    {hasAccess ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {isPrimary ? 'Your Portal' : 'Access Granted'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Restricted
                      </>
                    )}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-2 mb-4 sm:mb-6">
                  {role.features.slice(0, 3).map((feature, fIndex) => (
                    <li 
                      key={fIndex} 
                      className="flex items-start"
                    >
                      <CheckCircle className={`w-3 h-3 sm:w-4 sm:h-4 mt-0.5 mr-2 flex-shrink-0 ${
                        hasAccess ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-xs sm:text-sm ${hasAccess ? 'text-gray-700' : 'text-gray-500'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button 
                  onClick={() => hasAccess && handlePortalAccess(role.path, role.title)}
                  disabled={!hasAccess}
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-300 ease-out flex items-center justify-center text-sm sm:text-base ${
                    hasAccess
                      ? `${role.color} text-white ${role.hoverColor} hover:shadow-lg transform hover:scale-105`
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {hasAccess ? (
                    <>
                      {isPrimary ? 'Enter Portal' : 'Access Portal'}
                      <span className="ml-2">→</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Access Restricted
                    </>
                  )}
                </button>

                {/* Role Info - Hidden on mobile for cleaner look */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 hidden sm:block">
                  <p className="text-xs text-gray-500 text-center">
                    Available for: {role.backendRoles.join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Information Card */}
        {user && (
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl max-w-2xl mx-auto shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.firstName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-gray-800 text-base sm:text-lg">
                    {user.firstName} {user.lastName}
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base">{user.email}</p>
                  <div className="flex items-center justify-center sm:justify-start mt-2">
                    <span className="px-3 py-1 bg-white rounded-full text-xs sm:text-sm font-medium text-blue-700 shadow-sm">
                      {mappedRole} Role
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow text-sm sm:text-base"
              >
                View Profile
              </button>
            </div>
          </div>
        )}

        {/* Access Info Alert */}
        {mappedRole && mappedRole !== 'Admin' && (
          <div className="mt-6 sm:mt-8 max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-blue-800">
                  <span className="font-semibold">Access Level:</span> You currently have access to the {mappedRole} Portal only. 
                  {mappedRole !== 'Admin' && ' Contact your administrator if you need access to additional portals.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserRolesSection;