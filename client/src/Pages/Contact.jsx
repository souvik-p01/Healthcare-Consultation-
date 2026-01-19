import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  Calendar,
  Heart,
  Home,
  CheckCircle,
  User,
  Ambulance,
  Sparkles,
  Loader2,
  ExternalLink,
  Navigation,
  Search,
  Hospital,
  Building,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

// Healthcare Logo Component
const HealthcarePlusLogo = () => (
  <div className="flex items-center">
    <div className="relative w-10 h-10 mr-3">
      <div className="absolute inset-0 bg-blue-600 rounded-full"></div>
      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
        <Heart className="w-5 h-5 text-blue-600" />
      </div>
    </div>
    <div className="text-left">
      <h1 className="text-xl font-bold text-white">Healthcare<span className="text-blue-200">Plus</span></h1>
      <p className="text-xs text-blue-100">Your Health, Our Priority</p>
    </div>
  </div>
);

// IMPORTANT: Replace these with your actual API keys
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(0);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 23.073219, lng: 87.321978 });
  const [mapLocations, setMapLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const chatEndRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize EmailJS
  useEffect(() => {
    if (EMAILJS_PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY") {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, []);

  // Mock initial chat messages
  useEffect(() => {
    setChatMessages([
      { id: 1, text: "Hello! Welcome to Healthcare Plus. How can I help you today?", sender: 'admin', time: '10:00 AM' },
      { id: 2, text: "Hi, I need help with my appointment booking", sender: 'user', time: '10:02 AM' },
      { id: 3, text: "Sure! I'd be happy to help with that. Could you please provide your patient ID?", sender: 'admin', time: '10:03 AM' }
    ]);
  }, []);

  // Load nearby hospitals and pharmacies
  useEffect(() => {
    if (showMap && mapLoaded) {
      loadNearbyPlaces();
    }
  }, [showMap, mapLoaded, mapCenter]);

  const loadNearbyPlaces = async () => {
    try {
      // In a real app, you would use Google Places API here
      // For now, using mock data
      const mockLocations = [
        {
          id: 1,
          name: "Bishnupur District Hospital",
          type: "hospital",
          address: "Hospital Road, Bishnupur, West Bengal 722122",
          phone: "+91 98765 43210",
          lat: 23.073219,
          lng: 87.321978,
          rating: 4.2,
          opening_hours: "24/7"
        },
        {
          id: 2,
          name: "Apollo Pharmacy",
          type: "pharmacy",
          address: "Main Market, Bishnupur, West Bengal 722122",
          phone: "+91 98765 43211",
          lat: 23.072,
          lng: 87.322,
          rating: 4.5,
          opening_hours: "8 AM - 10 PM"
        },
        {
          id: 3,
          name: "City Medical Center",
          type: "hospital",
          address: "Near Bus Stand, Bankura, West Bengal 722101",
          phone: "+91 98765 43212",
          lat: 23.074,
          lng: 87.324,
          rating: 4.0,
          opening_hours: "24/7"
        },
        {
          id: 4,
          name: "Medplus Pharmacy",
          type: "pharmacy",
          address: "Station Road, Bishnupur, West Bengal 722122",
          phone: "+91 98765 43213",
          lat: 23.075,
          lng: 87.319,
          rating: 4.3,
          opening_hours: "9 AM - 9 PM"
        },
        {
          id: 5,
          name: "Government Health Center",
          type: "hospital",
          address: "Bishnupur Rural, West Bengal 722122",
          phone: "+91 98765 43214",
          lat: 23.071,
          lng: 87.325,
          rating: 3.8,
          opening_hours: "8 AM - 8 PM"
        }
      ];
      setMapLocations(mockLocations);
    } catch (error) {
      console.error("Error loading places:", error);
    }
  };

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Phone Support",
      desc: "Speak with our healthcare experts",
      info: "+91 98765 43210",
      availability: "24/7 Available",
      color: "from-green-500 to-emerald-600",
      action: () => window.location.href = 'tel:+919876543210',
      className: "hover:bg-green-50"
    },
    {
      icon: <Mail className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Email Support",
      desc: "Send us your queries and concerns",
      info: "support@healthcareplus.com",
      availability: "Response in 2 hours",
      color: "from-blue-500 to-cyan-600",
      action: () => window.location.href = 'mailto:support@healthcareplus.com?subject=Healthcare%20Support%20Inquiry',
      className: "hover:bg-blue-50"
    },
    {
      icon: <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Live Chat",
      desc: "Chat with our support team",
      info: "Available on website",
      availability: "9 AM - 9 PM",
      color: "from-purple-500 to-indigo-600",
      action: () => setChatActive(true),
      className: "hover:bg-purple-50"
    },
    {
      icon: <Ambulance className="w-6 h-6 md:w-8 md:h-8" />,
      title: "Emergency Line",
      desc: "For medical emergencies",
      info: "108 or +91 99999 00000",
      availability: "24/7 Emergency",
      color: "from-red-500 to-pink-600",
      action: () => navigate('/emergency'),
      className: "hover:bg-red-50"
    }
  ];

  const offices = [
    {
      name: "Main Hospital",
      address: "123 Healthcare Avenue, Bishnupur, West Bengal 722122",
      phone: "+91 98765 43210",
      email: "bishnupur@healthcareplus.com",
      hours: "24/7",
      services: ["Emergency Care", "General Medicine", "Surgery", "ICU"],
      coordinates: { lat: 23.073219, lng: 87.321978 }
    },
    {
      name: "Specialty Clinic",
      address: "456 Medical Street, Bankura, West Bengal 722101",
      phone: "+91 98765 43211",
      email: "bankura@healthcareplus.com",
      hours: "8 AM - 8 PM",
      services: ["Cardiology", "Neurology", "Orthopedics", "Pediatrics"],
      coordinates: { lat: 23.2325, lng: 87.8645 }
    },
    {
      name: "Diagnostic Center",
      address: "789 Health Plaza, Durgapur, West Bengal 713201",
      phone: "+91 98765 43212",
      email: "durgapur@healthcareplus.com",
      hours: "6 AM - 10 PM",
      services: ["Lab Tests", "Imaging", "Pathology", "Health Checkups"],
      coordinates: { lat: 23.5204, lng: 87.3119 }
    }
  ];

  const faqs = [
    {
      question: "How can I book an appointment?",
      answer: "You can book appointments through our patient portal, mobile app, or by calling our helpline. Online booking is available 24/7."
    },
    {
      question: "Do you accept insurance?",
      answer: "Yes, we accept most major insurance plans. Please contact us to verify your specific coverage before your visit."
    },
    {
      question: "What are your emergency services?",
      answer: "We provide 24/7 emergency services including ambulance, emergency room, trauma care, and critical care units."
    },
    {
      question: "How does the AI health assistant work?",
      answer: "Our AI assistant analyzes your symptoms and provides preliminary health advice. It's available 24/7 through our app and website."
    }
  ];

  const validateField = (name, value) => {
    switch (name) {
      case 'phone':
        if (value && !/^\d{10}$/.test(value)) {
          return 'Phone number must be exactly 10 digits';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      default:
        return '';
    }
    return '';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const newErrors = {};
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (EMAILJS_PUBLIC_KEY === "YOUR_EMAILJS_PUBLIC_KEY") {
        // Demo mode - simulate success
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
            priority: 'normal'
          });
          setSubmitStatus('success');
          setModalOpen(true);
          setIsSubmitting(false);
        }, 1000);
      } else {
        // Real email sending with EmailJS
        const templateParams = {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          to_email: 'admin@healthcareplus.com'
        };

        const response = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams
        );

        if (response.status === 200) {
          setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
            priority: 'normal'
          });
          setSubmitStatus('success');
          setModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Email sending error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleFAQ = (index) => {
    setActiveFAQ(prev => (prev === index ? null : index));
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: chatMessages.length + 1,
      text: newMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate admin response
    setIsTyping(true);
    setTimeout(() => {
      const adminResponse = {
        id: chatMessages.length + 2,
        text: getAdminResponse(newMessage),
        sender: 'admin',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, adminResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAdminResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('appointment') || message.includes('book')) {
      return "I can help you book an appointment. Please visit our Consultations page or call us at +91 98765 43210.";
    } else if (message.includes('emergency') || message.includes('urgent')) {
      return "For emergencies, please call 108 immediately or visit our Emergency page for more options.";
    } else if (message.includes('medicine') || message.includes('pharmacy')) {
      return "You can find nearby pharmacies on our map. Would you like me to help you locate one?";
    } else if (message.includes('doctor') || message.includes('specialist')) {
      return "We have various specialists available. Could you tell me which department you need?";
    } else {
      return "Thank you for your message. Our team will get back to you shortly with more specific assistance.";
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Filter mock data based on search query
      const results = mapLocations.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);

      if (results.length > 0 && mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        results.forEach(result => {
          bounds.extend({ lat: result.lat, lng: result.lng });
        });
        mapRef.current.fitBounds(bounds);
      } else if (mapRef.current) {
        // If no results, center on current location
        mapRef.current.panTo(mapCenter);
        mapRef.current.setZoom(14);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location) => {
    setMapCenter({ lat: location.lat, lng: location.lng });
    setSelectedMarker(location);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapRef.current.setZoom(16);
    }
  };

  const getDirections = (location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
    setMapLoaded(true);
    loadNearbyPlaces();
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '8px'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-8 pb-16 md:py-24 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <HealthcarePlusLogo />
            <NavLink 
              to="/"
              className="flex items-center text-white hover:text-blue-200 transition-colors bg-white bg-opacity-20 px-4 py-2 rounded-full hover:bg-opacity-30 backdrop-blur-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Back to Home</span>
            </NavLink>
          </div>
          
          <div className="text-center">
            <div className="relative inline-block">
              <Sparkles className="absolute -top-6 -left-6 w-8 h-8 text-yellow-300 animate-pulse" />
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Get in <span className="text-blue-200">Touch</span>
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
              We're here to help with all your healthcare needs. Reach out to our expert team anytime.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-16 -mt-8 md:-mt-12">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {contactMethods.map((method, index) => (
            <button
              key={index}
              onClick={method.action}
              className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${method.className}`}
            >
              <div className={`bg-gradient-to-r ${method.color} text-white w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto`}>
                {method.icon}
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-800 text-center mb-1 md:mb-2">{method.title}</h3>
              <p className="text-xs md:text-sm text-gray-600 text-center mb-2 md:mb-3">{method.desc}</p>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm md:text-base mb-1">{method.info}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {method.availability}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 text-sm">
                  Message sent successfully! We'll get back to you within 24 hours.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 text-sm">
                  Error sending message. Please try again or contact us directly.
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      <span>Email Address *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <span className="text-red-600 text-xs md:text-sm">{errors.email}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
                      placeholder="9876543210"
                      maxLength="10"
                    />
                    {errors.phone && (
                      <span className="text-red-600 text-xs md:text-sm">{errors.phone}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base resize-none"
                    placeholder="Please describe your inquiry in detail..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 md:py-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                  } text-sm md:text-base`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="w-5 h-5 mr-2" />
                      <span>Send Message</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 md:space-y-8">
            {/* Office Locations with Map Toggle */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Our Locations</h3>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              {showMap && (
                <div className="mb-4 md:mb-6">
                  {/* Map Search */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hospitals & pharmacies..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Google Map - Only load if API key is set */}
                  {GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY" ? (
                    <LoadScript 
                      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                      onLoad={() => setMapLoaded(true)}
                    >
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={14}
                        onLoad={handleMapLoad}
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false
                        }}
                      >
                        {mapLocations.map((location) => (
                          <Marker
                            key={location.id}
                            position={{ lat: location.lat, lng: location.lng }}
                            onClick={() => setSelectedMarker(location)}
                            icon={{
                              url: location.type === 'hospital' 
                                ? 'https://maps.google.com/mapfiles/ms/icons/hospital.png'
                                : 'https://maps.google.com/mapfiles/ms/icons/pharmacy.png',
                              scaledSize: new window.google.maps.Size(32, 32)
                            }}
                          />
                        ))}
                        {selectedMarker && (
                          <InfoWindow
                            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                            onCloseClick={() => setSelectedMarker(null)}
                          >
                            <div className="p-2 max-w-xs">
                              <h4 className="font-bold text-sm mb-1">{selectedMarker.name}</h4>
                              <p className="text-xs text-gray-600 mb-1">{selectedMarker.address}</p>
                              <p className="text-xs mb-1">📞 {selectedMarker.phone}</p>
                              <p className="text-xs mb-1">⭐ Rating: {selectedMarker.rating}/5</p>
                              <p className="text-xs mb-2">⏰ {selectedMarker.opening_hours}</p>
                              <button
                                onClick={() => getDirections(selectedMarker)}
                                className="mt-1 text-blue-600 text-xs hover:underline flex items-center"
                              >
                                <Navigation className="w-3 h-3 mr-1" />
                                Get Directions
                              </button>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  ) : (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center p-4">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Map functionality requires Google Maps API key</p>
                        <p className="text-xs text-gray-500 mt-1">Set GOOGLE_MAPS_API_KEY in Contact.jsx</p>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Search Results ({searchResults.length}):</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {searchResults.map(result => (
                          <div
                            key={result.id}
                            className="p-2 bg-white rounded border cursor-pointer hover:bg-blue-50 transition-colors"
                            onClick={() => handleLocationSelect(result)}
                          >
                            <div className="flex items-center">
                              {result.type === 'hospital' ? 
                                <Hospital className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" /> : 
                                <Building className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{result.name}</p>
                                <p className="text-xs text-gray-600 truncate">{result.address}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Office List */}
              <div className="space-y-3">
                {offices.map((office, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedOffice === index 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-blue-50'
                    }`}
                    onClick={() => {
                      setSelectedOffice(index);
                      setMapCenter(office.coordinates);
                      setShowMap(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-800 text-sm md:text-base">{office.name}</h4>
                      <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    </div>
                    <div className="space-y-1 text-xs md:text-sm text-gray-600 mt-2">
                      <div className="flex items-start">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{office.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                        <span>{office.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                        <span>{office.hours}</span>
                      </div>
                    </div>
                    {selectedOffice === index && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Services Available:</p>
                        <div className="flex flex-wrap gap-1">
                          {office.services.map((service, sIndex) => (
                            <span 
                              key={sIndex}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl md:rounded-2xl p-4 md:p-6 hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Need Immediate Help?</h3>
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => navigate('/consultations')}
                  className="w-full bg-white text-green-600 py-2 md:py-3 px-3 md:px-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center text-sm hover:scale-105"
                >
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Book Appointment</span>
                </button>
                <button
                  onClick={() => navigate('/emergency')}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 md:py-3 px-3 md:px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center text-sm hover:scale-105 shadow-lg"
                >
                  <Ambulance className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Emergency Services</span>
                </button>
                <button
                  onClick={() => window.location.href = 'tel:+919876543210'}
                  className="w-full bg-transparent border border-white text-white py-2 md:py-3 px-3 md:px-4 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-all duration-300 flex items-center justify-center text-sm hover:scale-105"
                >
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Call Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 md:mt-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base px-4">
              Find quick answers to common questions about our healthcare services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base flex-1">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 inline" />
                    {faq.question}
                  </h4>
                  {activeFAQ === index ? 
                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                  }
                </div>
                {activeFAQ === index && (
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed mt-3 pl-6">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 md:mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-6 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
          
          <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-white relative z-10" />
          <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 relative z-10">Still Have Questions?</h3>
          <p className="text-sm md:text-lg mb-4 md:mb-6 text-white text-opacity-90 max-w-2xl mx-auto relative z-10 px-4">
            Our healthcare experts are available 24/7 to assist you with any concerns
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center relative z-10">
            <button
              onClick={() => window.location.href = 'tel:+919876543210'}
              className="bg-white text-blue-600 px-4 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center text-sm min-h-[40px] md:min-h-[48px] hover:scale-105"
            >
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Call Now</span>
            </button>
            <button
              onClick={() => setChatActive(true)}
              className="border-2 border-white text-white px-4 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center text-sm min-h-[40px] md:min-h-[48px] hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Live Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Chat Widget */}
      {chatActive && (
        <div className="fixed bottom-4 right-4 w-full max-w-sm md:max-w-md bg-white rounded-xl shadow-2xl z-50 animate-slide-up border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <div>
              <h4 className="font-bold">Healthcare Support</h4>
              <p className="text-sm opacity-90">Online • 24/7 Available</p>
            </div>
            <button
              onClick={() => setChatActive(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="h-64 md:h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">Admin is typing...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <button
                onClick={sendChatMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Helper */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <button
          onClick={() => setChatActive(!chatActive)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          {chatActive ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>

      {/* Success Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Message Sent Successfully!</h2>
              <p className="text-gray-600 mb-6">Thank you for contacting us. We will get back to you within 24 hours.</p>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ContactPage;