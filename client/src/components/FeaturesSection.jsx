import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle,
  LogIn,
  AlertCircle
} from 'lucide-react';

// Mock authentication check (replace with your actual auth logic)
const checkAuthStatus = () => {
  // Check if user is logged in (from localStorage, context, redux, etc.)
  return localStorage.getItem('isLoggedIn') === 'true' || 
         localStorage.getItem('userToken') || 
         sessionStorage.getItem('isAuthenticated') === 'true';
};

// Features Section Component
const FeaturesSection = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = checkAuthStatus();
      setIsLoggedIn(loggedIn);
    };
    
    checkAuth();
    
    // Listen for auth changes (you might need to implement this based on your auth system)
    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  // Service routes mapping
  const serviceRoutes = {
    1: "/services/assistant",
    2: "/services/consultations", 
    3: "/services/emergency",
    4: "/services/pharmacy",
    5: "/services/monitoring",
    6: "/services/records"
  };

  const features = [
    {
      id: 1,
      icon: <Brain className="w-8 h-8" />,
      title: "AI Health Assistant",
      description: "Get instant health advice and symptom analysis powered by advanced AI technology.",
      color: "from-purple-500 to-indigo-600",
      gradient: "bg-gradient-to-r from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      requiresAuth: false // This service might be accessible without login
    },
    {
      id: 2,
      icon: <Stethoscope className="w-8 h-8" />,
      title: "Expert Consultations",
      description: "Connect with certified doctors through video calls, chat, or in-person appointments.",
      color: "from-blue-500 to-cyan-600",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      requiresAuth: true
    },
    {
      id: 3,
      icon: <Ambulance className="w-8 h-8" />,
      title: "Emergency Services",
      description: "24/7 emergency response with real-time ambulance tracking and hospital coordination.",
      color: "from-red-500 to-pink-600",
      gradient: "bg-gradient-to-r from-red-500 to-pink-600",
      bgColor: "bg-red-50",
      requiresAuth: false // Emergency services should be accessible to all
    },
    {
      id: 4,
      icon: <Pill className="w-8 h-8" />,
      title: "Pharmacy Network",
      description: "Find nearby pharmacies, compare prices, and get medicines delivered to your door.",
      color: "from-green-500 to-emerald-600",
      gradient: "bg-gradient-to-r from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      requiresAuth: true
    },
    {
      id: 5,
      icon: <Activity className="w-8 h-8" />,
      title: "Health Monitoring",
      description: "Track your vitals, medications, and health progress with smart reminders.",
      color: "from-orange-500 to-yellow-600",
      gradient: "bg-gradient-to-r from-orange-500 to-yellow-600",
      bgColor: "bg-orange-50",
      requiresAuth: true
    },
    {
      id: 6,
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Records",
      description: "Your medical data is encrypted and securely stored with easy access when needed.",
      color: "from-gray-500 to-slate-600",
      gradient: "bg-gradient-to-r from-gray-500 to-slate-600",
      bgColor: "bg-gray-50",
      requiresAuth: true
    }
  ];

  const handleFeatureClick = (feature) => {
    // If service requires authentication and user is not logged in
    if (feature.requiresAuth && !isLoggedIn) {
      setSelectedService(feature);
      setShowLoginModal(true);
      return;
    }
    
    // If logged in or doesn't require auth, navigate to the service
    const route = serviceRoutes[feature.id];
    if (route) {
      navigate(route);
    } else {
      navigate('/services');
    }
  };

  const handleViewAllClick = () => {
    if (isLoggedIn) {
      navigate('/services');
    } else {
      // Show login modal for accessing all services
      setSelectedService({ title: "All Services", id: 'all' });
      setShowLoginModal(true);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate('/login', { state: { redirectTo: selectedService ? serviceRoutes[selectedService.id] : '/services' } });
  };

  const handleSignupRedirect = () => {
    setShowLoginModal(false);
    navigate('/signup', { state: { redirectTo: selectedService ? serviceRoutes[selectedService.id] : '/services' } });
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setSelectedService(null);
  };

  // Login Modal Component
  const LoginModal = () => {
    if (!showLoginModal) return null;

    const serviceName = selectedService?.title || "this service";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 animate-scale-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Login Required</h3>
            </div>
            <button 
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                {selectedService?.icon || <Shield className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Access {serviceName}</h4>
                <p className="text-sm text-gray-600">To continue, please sign in to your account</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Benefits of logging in:</span>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Access personalized healthcare services
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Save your medical history securely
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Book appointments and consultations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Get personalized health recommendations
                  </li>
                </ul>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLoginRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In to Continue
            </button>
            
            <button
              onClick={handleSignupRedirect}
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors"
            >
              Create New Account
            </button>
            
            <button
              onClick={handleCloseModal}
              className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm"
            >
              Maybe later
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="services" className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 relative">
      {/* Login Modal */}
      <LoginModal />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mr-2" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
              Comprehensive <span className="text-blue-600">Healthcare</span> Solutions
            </h2>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 px-4">
            From AI-powered diagnostics to emergency services, we provide everything you need for complete healthcare management
          </p>
          
          {/* User Status Indicator */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {isLoggedIn ? (
              <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full">
                <UserCheck className="w-4 h-4 mr-2" />
                <span className="font-medium">Welcome back!</span>
              </div>
            ) : (
              <div className="inline-flex items-center bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="font-medium">Sign in for full access</span>
              </div>
            )}
          </div>
          
          {/* Call to Action Button */}
          <button
            onClick={() => navigate(isLoggedIn ? '/services' : '/login')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {isLoggedIn ? 'Explore All Services' : 'Sign In to Get Started'}
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              onClick={() => handleFeatureClick(feature)}
              className={`group bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-100 relative overflow-hidden ${
                feature.requiresAuth && !isLoggedIn ? 'opacity-80' : ''
              }`}
            >
              {/* Auth Required Badge */}
              {feature.requiresAuth && !isLoggedIn && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Login Required
                </div>
              )}
              
              {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
              
              {/* Icon with background */}
              <div className={`${feature.bgColor} text-blue-600 w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {feature.description}
              </p>
              
              {/* Learn More Button */}
              <div className="flex items-center justify-between mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFeatureClick(feature);
                  }}
                  className={`${feature.gradient} text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center text-sm md:text-base`}
                >
                  {feature.requiresAuth && !isLoggedIn ? 'Login to Access' : 'Learn More'}
                  <ChevronDown className="w-4 h-4 ml-2 transform group-hover:translate-y-1 transition-transform" />
                </button>
                
                {/* Quick Stats */}
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {feature.requiresAuth ? (isLoggedIn ? 'Available' : 'Login Required') : 'Available Now'}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold ml-1">4.8</span>
                  </div>
                </div>
              </div>
              
              {/* Hover Indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {isLoggedIn 
              ? 'Looking for something specific? Our comprehensive platform offers even more specialized services tailored to your needs.'
              : 'Sign in to unlock personalized healthcare services, appointment booking, and secure medical record management.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleViewAllClick}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center"
            >
              <Settings className="w-5 h-5 mr-2" />
              {isLoggedIn ? 'View All Services' : 'Sign Up for Free'}
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-300 font-semibold flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Contact Support
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">50K+</div>
            <div className="text-gray-600">Patients Served</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">150+</div>
            <div className="text-gray-600">Expert Doctors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">Support Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.9</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;