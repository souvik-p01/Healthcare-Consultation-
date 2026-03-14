import React from 'react';
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
  CheckCircle
} from 'lucide-react';

// Footer Component
const Footer = () => {
  const navigate = useNavigate();

  // Service routes mapping
  const serviceRoutes = {
    1: "/services/assistant",
    2: "/services/consultations",
    3: "/services/emergency",
    4: "/services/pharmacy",
    5: "/services/monitoring",
    6: "/services/records"
  };

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleServiceNavigation = (serviceId) => {
    const route = serviceRoutes[serviceId];
    if (route) {
      navigate(route);
    }
  };

  const handleQuickLink = (section) => {
    // For now, we'll use navigation. You can also implement scroll to section
    if (section === 'home') {
      navigate('/');
    } else if (section === 'about') {
      navigate('/about');
    } else if (section === 'services') {
      navigate('/services');
    } else if (section === 'contact') {
      navigate('/contact');
    }
  };

  return (
    <footer className="bg-gray-800 text-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">HealthCare<span className="text-blue-400">Plus</span></span>
            </div>
            <p className="text-gray-400 mb-4 text-sm md:text-base">
              Revolutionizing healthcare with AI-powered solutions and comprehensive medical services.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={() => handleNavigation('/')}
                className="w-8 h-8 bg-blue-600 rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                aria-label="Facebook"
              >
                <span className="text-xs font-bold">F</span>
              </button>
              <button 
                onClick={() => handleNavigation('/')}
                className="w-8 h-8 bg-blue-500 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                aria-label="Twitter"
              >
                <span className="text-xs font-bold">T</span>
              </button>
              <button 
                onClick={() => handleNavigation('/')}
                className="w-8 h-8 bg-blue-700 rounded hover:bg-blue-800 transition-colors flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <span className="text-xs font-bold">L</span>
              </button>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => handleQuickLink('home')}
                  className="hover:text-white transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLink('about')}
                  className="hover:text-white transition-colors text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLink('services')}
                  className="hover:text-white transition-colors text-left"
                >
                  Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLink('contact')}
                  className="hover:text-white transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => handleServiceNavigation(1)}
                  className="hover:text-white transition-colors text-left flex items-center"
                >
                  <Brain className="w-3 h-3 mr-2" />
                  AI Consultations
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceNavigation(2)}
                  className="hover:text-white transition-colors text-left flex items-center"
                >
                  <Stethoscope className="w-3 h-3 mr-2" />
                  Telemedicine
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceNavigation(3)}
                  className="hover:text-white transition-colors text-left flex items-center"
                >
                  <Ambulance className="w-3 h-3 mr-2" />
                  Emergency Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceNavigation(4)}
                  className="hover:text-white transition-colors text-left flex items-center"
                >
                  <Pill className="w-3 h-3 mr-2" />
                  Pharmacy Network
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceNavigation(5)}
                  className="hover:text-white transition-colors text-left flex items-center"
                >
                  <Activity className="w-3 h-3 mr-2" />
                  Health Monitoring
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceNavigation(6)}
                  className="hover:text-white transition-colors text-left flex items-center"
                >
                  <Shield className="w-3 h-3 mr-2" />
                  Secure Records
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <button 
                  onClick={() => window.open('tel:+919876543210')}
                  className="hover:text-white transition-colors text-left"
                >
                  +91 98765 43210
                </button>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <button 
                  onClick={() => window.open('mailto:support@healthcareplus.com')}
                  className="hover:text-white transition-colors text-left"
                >
                  support@healthcareplus.com
                </button>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Bishnupur, West Bengal, India</span>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Stay Updated</h4>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button 
                  onClick={() => handleNavigation('/subscribe')}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg transition-colors text-sm"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p>&copy; 2024 HealthCarePlus. All rights reserved.</p>
            <div className="flex space-x-6">
              <button 
                onClick={() => handleNavigation('/privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => handleNavigation('/terms')}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => handleNavigation('/sitemap')}
                className="hover:text-white transition-colors"
              >
                Sitemap
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm">Patients Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">150+</div>
              <div className="text-sm">Expert Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">4.9</div>
              <div className="text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;