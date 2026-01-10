import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Stethoscope, 
  Ambulance, 
  Pill, 
  Activity, 
  Shield, 
  Video, 
  Calendar,
  Phone,
  MapPin,
  Clock,
  Users,
  Heart,
  Microscope,
  FileText,
  Home,
  ChevronRight,
  Star,
  CheckCircle,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from "react-router-dom";

// Mock Link component that can be replaced with actual NavLink
const Link = ({ to, children, className }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      console.log(`Navigate to: ${to}`);
    }
  };
  
  return (
    <button 
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
};

const ServicesSection = () => {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Service routes mapping
  const serviceRoutes = {
    1: "/services/assistant",
    2: "/services/consultations",
    3: "/services/emergency",
    4: "/services/pharmacy",
    5: "/services/monitoring",
    6: "/services/records"
  };

  // Main services data
  const services = [
    {
      id: 1,
      title: "AI Health Assistant",
      category: "ai",
      icon: <Brain className="w-8 h-8" />,
      shortDesc: "Get instant health advice powered by advanced AI technology.",
      fullDesc: "Our AI Health Assistant provides 24/7 intelligent health consultations, symptom analysis, and personalized health recommendations using cutting-edge machine learning algorithms.",
      features: ["24/7 Availability", "Symptom Analysis", "Health Recommendations", "Medical History Integration"],
      price: "Free",
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      gradient: "bg-gradient-to-r from-purple-500 to-indigo-600"
    },
    {
      id: 2,
      title: "Expert Consultations",
      category: "consultation",
      icon: <Stethoscope className="w-8 h-8" />,
      shortDesc: "Connect with certified doctors through video calls and appointments.",
      fullDesc: "Book appointments with our network of 150+ certified specialists. Choose from video consultations, phone calls, or in-person visits at your convenience.",
      features: ["150+ Specialists", "Video Consultations", "In-person Visits", "Same-day Booking"],
      price: "From ₹299",
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-600"
    },
    {
      id: 3,
      title: "Emergency Services",
      category: "emergency",
      icon: <Ambulance className="w-8 h-8" />,
      shortDesc: "24/7 emergency response with real-time ambulance tracking.",
      fullDesc: "Immediate emergency medical response with GPS-tracked ambulances, direct hospital coordination, and real-time updates for your family.",
      features: ["24/7 Response", "GPS Tracking", "Hospital Network", "Family Alerts"],
      price: "On Demand",
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      gradient: "bg-gradient-to-r from-red-500 to-pink-600"
    },
    {
      id: 4,
      title: "Pharmacy Network",
      category: "pharmacy",
      icon: <Pill className="w-8 h-8" />,
      shortDesc: "Find nearby pharmacies and get medicines delivered to your door.",
      fullDesc: "Access our network of 500+ partner pharmacies. Compare prices, check availability, and get medicines delivered to your doorstep within hours.",
      features: ["500+ Pharmacies", "Price Comparison", "Home Delivery", "Prescription Management"],
      price: "Delivery ₹49",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      gradient: "bg-gradient-to-r from-green-500 to-emerald-600"
    },
    {
      id: 5,
      title: "Health Monitoring",
      category: "monitoring",
      icon: <Activity className="w-8 h-8" />,
      shortDesc: "Track your vitals and health progress with smart reminders.",
      fullDesc: "Comprehensive health tracking with IoT device integration, medication reminders, vital signs monitoring, and progress analytics.",
      features: ["Vital Signs Tracking", "Medication Reminders", "Progress Analytics", "IoT Integration"],
      price: "₹199/month",
      color: "from-orange-500 to-yellow-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      gradient: "bg-gradient-to-r from-orange-500 to-yellow-600"
    },
    {
      id: 6,
      title: "Secure Records",
      category: "records",
      icon: <Shield className="w-8 h-8" />,
      shortDesc: "Your medical data encrypted and securely stored with easy access.",
      fullDesc: "Military-grade encryption for your medical records with blockchain verification, easy sharing with healthcare providers, and lifetime storage.",
      features: ["Military-grade Encryption", "Blockchain Verification", "Easy Sharing", "Lifetime Storage"],
      price: "Free",
      color: "from-gray-500 to-slate-600",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
      gradient: "bg-gradient-to-r from-gray-500 to-slate-600"
    }
  ];

  // Additional services
  const additionalServices = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "Telemedicine",
      desc: "Remote consultations with doctors",
      route: "/services/telemedicine"  // Add this
    },
    {
      icon: <Microscope className="w-6 h-6" />,
      title: "Lab Tests",
      desc: "Home sample collection and analysis",
      route: "/services/lab-tests"  // Add this
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Health Reports",
      desc: "Detailed health analysis and insights",
      route: "/services/health-reports"  // Add this
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Wellness Programs",
      desc: "Personalized fitness and nutrition plans",
      route: "/services/wellness-programs"  // Add this
    }
  ];

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Services', count: services.length },
    { id: 'ai', label: 'AI Powered', count: services.filter(s => s.category === 'ai').length },
    { id: 'consultation', label: 'Consultations', count: services.filter(s => s.category === 'consultation').length },
    { id: 'emergency', label: 'Emergency', count: services.filter(s => s.category === 'emergency').length },
    { id: 'pharmacy', label: 'Pharmacy', count: services.filter(s => s.category === 'pharmacy').length }
  ];

  // Filter services based on selected category
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  // Container variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item variants for individual animations
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 md:py-16 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 md:mb-16"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center mb-4 md:mb-6"
          >
            <Link 
              to="/" 
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4 bg-blue-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-blue-100 text-sm md:text-base"
            >
              <Home className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative inline-block"
          >
            <Sparkles className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 md:mb-6 leading-tight">
              Our Healthcare <span className="text-blue-600">Services</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-2"
          >
            Comprehensive healthcare solutions powered by AI technology and delivered by expert medical professionals
          </motion.p>
        </motion.div>

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {category.label}
              <span className="ml-1 md:ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                {category.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Main Services Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-16"
        >
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className="group relative bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
              onMouseEnter={() => setActiveService(service.id)}
              onMouseLeave={() => setActiveService(null)}
              whileHover={{ y: -10 }}
            >
              {/* Service Header */}
              <div className={`bg-gradient-to-r ${service.color} p-4 md:p-6 text-white relative overflow-hidden`}>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-white bg-opacity-10 rounded-full -translate-y-8 md:-translate-y-10 translate-x-8 md:translate-x-10"
                ></motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 bg-white bg-opacity-10 rounded-full translate-y-6 md:translate-y-8 -translate-x-6 md:-translate-x-8"
                ></motion.div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <motion.div 
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className="bg-white bg-opacity-20 p-2 md:p-3 rounded-xl"
                    >
                      {service.icon}
                    </motion.div>
                    <div className="text-right">
                      <div className="text-xs md:text-sm opacity-90">Starting from</div>
                      <div className="font-bold text-base md:text-lg">{service.price}</div>
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{service.title}</h3>
                  <p className="text-white text-opacity-90 text-xs md:text-sm">{service.shortDesc}</p>
                </div>
              </div>

              {/* Service Content */}
              <div className="p-4 md:p-6">
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">{service.fullDesc}</p>
                
                {/* Features List */}
                <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                  {service.features.map((feature, fIndex) => (
                    <motion.div 
                      key={fIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: fIndex * 0.1 }}
                      className="flex items-center text-xs md:text-sm text-gray-600"
                    >
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-1.5 md:mr-2 flex-shrink-0" />
                      {feature}
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 md:space-x-3">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(serviceRoutes[service.id])}
                    className={`flex-1 ${service.gradient} text-white py-2 md:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-sm md:text-base`}
                  >
                    Get Started
                  </motion.button>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    className="px-3 py-2 md:px-4 md:py-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Services */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-8 md:mb-16"
        >
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-8 text-center">Additional Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {additionalServices.map((service, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="text-center p-3 md:p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(service.route)}  // Add this
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="bg-blue-100 text-blue-600 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3"
                >
                  {service.icon}
                </motion.div>
                <h4 className="font-semibold text-gray-800 mb-1 md:mb-2 text-sm md:text-base">{service.title}</h4>
                <p className="text-xs md:text-sm text-gray-600">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 1 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-6 md:p-12 text-center text-white overflow-hidden relative"
        >
          {/* Animated background elements */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-10 md:-top-20 -right-10 md:-right-20 w-20 h-20 md:w-40 md:h-40 bg-white bg-opacity-10 rounded-full"
          ></motion.div>
          <motion.div 
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-8 md:-bottom-16 -left-8 md:-left-16 w-16 h-16 md:w-32 md:h-32 bg-white bg-opacity-10 rounded-full"
          ></motion.div>
          
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 relative z-10">Ready to Get Started?</h3>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-white text-opacity-90 max-w-2xl mx-auto relative z-10 px-2">
            Join thousands of satisfied patients who trust us with their healthcare needs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center relative z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Start Your Journey <Zap className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white text-white px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Schedule Consultation <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-16"
        >
          {[
            { number: "50K+", label: "Happy Patients", icon: <Users className="w-5 h-5 md:w-6 md:h-6" /> },
            { number: "150+", label: "Expert Doctors", icon: <Stethoscope className="w-5 h-5 md:w-6 md:h-6" /> },
            { number: "24/7", label: "Support Available", icon: <Clock className="w-5 h-5 md:w-6 md:h-6" /> },
            { number: "4.9★", label: "Average Rating", icon: <Star className="w-5 h-5 md:w-6 md:h-6" /> }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="text-center bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <motion.div 
                whileHover={{ scale: 1.2, rotate: 5 }}
                className="text-blue-600 mb-1 md:mb-2 flex justify-center"
              >
                {stat.icon}
              </motion.div>
              <div className="text-xl md:text-2xl font-bold text-gray-800 mb-0.5 md:mb-1">{stat.number}</div>
              <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mobile Navigation Helper */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        className="fixed bottom-4 right-4 z-50 sm:hidden"
      >
        <Link 
          to="/"
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Home className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
};

export default ServicesSection;