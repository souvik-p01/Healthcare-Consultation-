import React, { useState, useCallback } from 'react';
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
  Sparkles
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Modal } from 'antd';
import { CloseOutlined } from "@ant-design/icons";
import { assets } from '../assets/assets';

// Improved SVG Logo Component with proper healthcare styling
const HealthcarePlusLogo = () => (
  <svg
    width="200"
    height="50"
    viewBox="0 0 200 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-auto mr-4"
  >
    <g transform="translate(10, 10)">
      <rect x="10" y="5" width="6" height="20" fill="#ffffff" rx="1"/>
      <rect x="3" y="12" width="20" height="6" fill="#ffffff" rx="1"/>
      <circle cx="13" cy="15" r="12" stroke="#60A5FA" strokeWidth="2" fill="none"/>
    </g>
    
    <text
      x="50"
      y="20"
      fontFamily="Arial, sans-serif"
      fontSize="16"
      fontWeight="bold"
      fill="#ffffff"
    >
      Healthcare
    </text>
    <text
      x="130"
      y="20"
      fontFamily="Arial, sans-serif"
      fontSize="16"
      fontWeight="bold"
      fill="#60A5FA"
    >
      Plus
    </text>
    
    <text
      x="50"
      y="35"
      fontFamily="Arial, sans-serif"
      fontSize="10"
      fill="#E0E7FF"
    >
      Your Health, Our Priority
    </text>
    
    <circle cx="180" cy="15" r="3" fill="#60A5FA" opacity="0.7"/>
    <circle cx="190" cy="25" r="2" fill="#ffffff" opacity="0.8"/>
    <circle cx="175" cy="30" r="2" fill="#60A5FA" opacity="0.6"/>
  </svg>
);

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // Success or error message
  const [selectedOffice, setSelectedOffice] = useState(0);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const contactMethods = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Phone Support",
      desc: "Speak with our healthcare experts",
      info: "+91 98765 43210",
      availability: "24/7 Available",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email Support",
      desc: "Send us your queries and concerns",
      info: "support@healthcareplus.com",
      availability: "Response in 2 hours",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Live Chat",
      desc: "Chat with our support team",
      info: "Available on website",
      availability: "9 AM - 9 PM",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <Ambulance className="w-8 h-8" />,
      title: "Emergency Line",
      desc: "For medical emergencies",
      info: "108 or +91 99999 00000",
      availability: "24/7 Emergency",
      color: "from-red-500 to-pink-600"
    }
  ];

  const offices = [
    {
      name: "Main Hospital",
      address: "123 Healthcare Avenue, Bishnupur, West Bengal 722122",
      phone: "+91 98765 43210",
      email: "bishnupur@healthcareplus.com",
      hours: "24/7",
      services: ["Emergency Care", "General Medicine", "Surgery", "ICU"]
    },
    {
      name: "Specialty Clinic",
      address: "456 Medical Street, Bankura, West Bengal 722101",
      phone: "+91 98765 43211",
      email: "bankura@healthcareplus.com",
      hours: "8 AM - 8 PM",
      services: ["Cardiology", "Neurology", "Orthopedics", "Pediatrics"]
    },
    {
      name: "Diagnostic Center",
      address: "789 Health Plaza, Durgapur, West Bengal 713201",
      phone: "+91 98765 43212",
      email: "durgapur@healthcareplus.com",
      hours: "6 AM - 10 PM",
      services: ["Lab Tests", "Imaging", "Pathology", "Health Checkups"]
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
    if (name === 'phone') {
      if (value && !/^\d{10}$/.test(value)) {
        return 'Phone number must be exactly 10 digits';
      }
    }
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return ''; 
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = useCallback(async (e) => {
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

    setErrors({});

    setErrors({});

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
    } catch (error) {
      setSubmitStatus('Error submitting form. Please try again later.');
    } finally {
      setIsSubmitting(false);
      setModalOpen(true);
    }
  }, [formData]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const toggleFAQ = useCallback((index) => {
    setActiveFAQ((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-bounce"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6 flex-wrap gap-4">
              <HealthcarePlusLogo />
              <NavLink 
                to="/"
                className="flex items-center text-white hover:text-blue-200 transition-colors bg-white bg-opacity-20 px-4 py-2 rounded-full hover:bg-opacity-30 backdrop-blur-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Back to Home</span>
              </NavLink>
            </div>
            
            <div className="relative inline-block">
              <Sparkles className="absolute -top-6 -left-6 w-8 h-8 text-yellow-300 animate-pulse" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Get in <span className="text-blue-200">Touch</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We're here to help with all your healthcare needs. Reach out to our expert team anytime.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 -mt-12">
          {contactMethods.map((method, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105"
            >
              <div className={`bg-gradient-to-r ${method.color} text-white w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                {method.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2">{method.title}</h3>
              <p className="text-sm text-gray-600 text-center mb-3">{method.desc}</p>
              <div className="text-center">
                <p className="font-semibold text-gray-800 mb-1">{method.info}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {method.availability}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
              {submitStatus && (
                <div className={`mb-4 p-4 rounded-lg text-sm ${submitStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  <span>{submitStatus}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <span className="text-red-600 text-sm">{errors.email}</span>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      max={10}
                      min={10}
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="98765 43210"
                    />
                    {errors.phone && (
                      <span className="text-red-600 text-sm">{errors.phone}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span>Priority Level</span>
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span>Subject *</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span>Message *</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Please describe your inquiry in detail..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
          <div className="space-y-8">
            {/* Office Locations */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Our Locations</h3>
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                      selectedOffice === index 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'bg-gray-50 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedOffice(index)}
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">{office.name}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{office.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{office.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{office.hours}</span>
                      </div>
                    </div>
                    {selectedOffice === index && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Services Available:</p>
                        <div className="flex flex-wrap gap-1">
                          {office.services.map((service, sIndex) => (
                            <span 
                              key={sIndex}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
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
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-xl font-bold mb-4">Need Immediate Help?</h3>
              <div className="space-y-3">
                <NavLink
                  to="/patient-portal"
                  className="w-full bg-white text-green-600 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center text-sm min-h-[48px] hover:scale-105"
                >
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Book Appointment</span>
                </NavLink>
                <NavLink
                  to="/emergency-services"
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center text-sm min-h-[48px] hover:scale-105 shadow-lg"
                >
                  <Ambulance className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Emergency Services</span>
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about our healthcare services
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => toggleFAQ(index)}
              >
                <h4 className="font-semibold text-gray-800 mb-3 flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{faq.question}</span>
                </h4>
                {activeFAQ === index && (
                  <p className="text-gray-600 text-sm leading-relaxed ml-7">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-bounce"></div>
          
          <Heart className="w-16 h-16 mx-auto mb-4 text-white relative z-10" />
          <h3 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">Still Have Questions?</h3>
          <p className="text-lg mb-6 text-white text-opacity-90 max-w-2xl mx-auto relative z-10">
            Our healthcare experts are available 24/7 to assist you with any concerns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button
              onClick={() => window.location.href = 'tel:+919876543210'}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center text-sm min-h-[48px] hover:scale-105"
            >
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Call Now</span>
            </button>
            <NavLink
              to="/live-chat"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center text-sm min-h-[48px] hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Live Chat</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Helper */}
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <NavLink 
          to="/"
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center animate-bounce"
        >
          <Home className="w-6 h-6" />
        </NavLink>
      </div>

      {modalOpen && (
        <Modal
          open={modalOpen}
          onCancel={() => setModalOpen(false)} 
          footer={null}
          width={400}
          closeIcon={<CloseOutlined style={{ color: "red", fontSize: "18px" }} />}
          centered
          maskClosable={true}
        >
          <div className="text-center">
            <h2 className="text-lg font-bold mb-2">Thank you for your message!</h2>
            {/* <img src={assets.Empty} alt='Thank You' /> */}
            <p>We will get back to you within 24 hours.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContactPage;