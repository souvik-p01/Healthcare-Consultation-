import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Star,
  MessageSquare,
  FileText,
  Shield,
  Zap,
  Home,
  ChevronRight,
  User,
  Stethoscope,
  Lock,
  MapPin,
  X,
  Award,
  Languages,
  DollarSign,
  Search,
  Filter,
  Mic,
  Camera,
  Upload,
  Shield as ShieldIcon,
  Smartphone,
  Wifi,
  Heart,
  AlertCircle,
  Bookmark,
  Share2,
  Download,
  Printer,
  VideoOff,
  PhoneOff,
  MessageCircle,
  Battery,
  Activity
} from 'lucide-react';

// Mock WebRTC service for video calls (in real app, use WebRTC libraries like SimplePeer)
const initiateVideoCall = async (doctorId) => {
  console.log(`Initiating encrypted video call with doctor ${doctorId}`);
  // In production, integrate with WebRTC/WebSocket services
  return { callId: `call_${Date.now()}`, status: 'connecting' };
};

// Mock WebSocket service for chat (in real app, use Socket.io or similar)
const initiateChatSession = async (doctorId) => {
  console.log(`Starting encrypted chat with doctor ${doctorId}`);
  return { sessionId: `chat_${Date.now()}`, encrypted: true };
};

// Mock telephony service
const initiatePhoneCall = async (doctorId) => {
  console.log(`Initiating phone call with doctor ${doctorId}`);
  return { callId: `phone_${Date.now()}`, attended: true };
};

const Telemedicine = () => {
  const [selectedPlan, setSelectedPlan] = useState('video');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    age: '',
    gender: '',
    symptoms: '',
    phone: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCall, setActiveCall] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [videoStream, setVideoStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Initialize media devices
  useEffect(() => {
    if (selectedPlan === 'video') {
      checkMediaPermissions();
    }
    
    // Simulate connection quality
    const interval = setInterval(() => {
      const qualities = ['excellent', 'good', 'fair', 'poor'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionStatus(randomQuality);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPlan]);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setVideoStream(stream);
    } catch (err) {
      console.log('Media permissions denied');
    }
  };

  const consultationTypes = [
    {
      id: 'video',
      title: 'Video Consultation',
      icon: <Video className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Shield className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      ),
      price: '₹499',
      duration: '30 minutes',
      features: [
        'One-on-one end-to-end encrypted video',
        'HD quality with screen sharing',
        'Secure file transfer for reports',
        'Digital prescription generation',
        'Session recording available',
        'Real-time vital monitoring'
      ],
      tech: ['WebRTC', 'AES-256 Encryption', 'WebSocket'],
      popular: true,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'phone',
      title: 'Phone Consultation',
      icon: <Phone className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
            <Mic className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      ),
      price: '₹299',
      duration: '20 minutes',
      features: [
        'Direct attended phone consultation',
        'Call recording with consent',
        'Automated SMS follow-up',
        'Voice-to-text transcription',
        'Emergency callback feature',
        'Multi-language support'
      ],
      tech: ['VoIP', 'SIP Protocol', 'AES Encryption'],
      popular: false,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'chat',
      title: 'Chat Consultation',
      icon: <MessageSquare className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      ),
      price: '₹199',
      duration: '24 hour access',
      features: [
        'End-to-end encrypted messaging',
        'Secure image/document sharing',
        'Asynchronous communication',
        'Prescription in chat history',
        'Automated symptom checker',
        'Typing indicators & read receipts'
      ],
      tech: ['WebSocket', 'E2EE', 'Message Queue'],
      popular: false,
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  const doctorsBySpecialty = {
    'General Physician': [
      {
        id: 'GP001',
        name: 'Dr. Rajesh Kumar',
        hospital: 'Apollo Hospital, Delhi',
        experience: '15 years',
        rating: 4.8,
        reviews: 245,
        languages: ['English', 'Hindi'],
        fee: '₹499',
        nextAvailable: 'Today, 2:00 PM',
        timeSlots: ['2:00 PM', '3:30 PM', '5:00 PM', '6:30 PM'],
        availability: 'online',
        specializations: ['Diabetes', 'Hypertension', 'General Medicine'],
        education: 'MBBS, MD (Medicine)',
        verified: true,
        responseTime: '5 mins'
      },
      {
        id: 'GP002',
        name: 'Dr. Priya Sharma',
        hospital: 'Fortis Healthcare, Mumbai',
        experience: '12 years',
        rating: 4.9,
        reviews: 312,
        languages: ['English', 'Hindi', 'Marathi'],
        fee: '₹599',
        nextAvailable: 'Today, 3:00 PM',
        timeSlots: ['3:00 PM', '4:00 PM', '7:00 PM', '8:00 PM'],
        availability: 'online',
        specializations: ['Fever', 'Cough', 'Allergies'],
        education: 'MBBS, DNB (Medicine)',
        verified: true,
        responseTime: '3 mins'
      }
    ],
    'Dermatology': [
      {
        id: 'DER001',
        name: 'Dr. Anjali Mehta',
        hospital: 'Max Hospital, Bangalore',
        experience: '10 years',
        rating: 4.7,
        reviews: 189,
        languages: ['English', 'Hindi', 'Kannada'],
        fee: '₹699',
        nextAvailable: 'Tomorrow, 10:00 AM',
        timeSlots: ['10:00 AM', '11:30 AM', '2:00 PM', '4:00 PM'],
        availability: 'offline',
        specializations: ['Acne', 'Psoriasis', 'Skin Allergy'],
        education: 'MBBS, MD (Dermatology)',
        verified: true,
        responseTime: '15 mins'
      }
    ],
    // Add more specialties with similar structure...
  };

  const specialties = [
    { name: 'General Physician', icon: '🩺', color: 'bg-blue-100 text-blue-800' },
    { name: 'Dermatology', icon: '💆', color: 'bg-purple-100 text-purple-800' },
    { name: 'Pediatrics', icon: '👶', color: 'bg-pink-100 text-pink-800' },
    { name: 'Gynecology', icon: '🤰', color: 'bg-red-100 text-red-800' },
    { name: 'Psychiatry', icon: '🧠', color: 'bg-indigo-100 text-indigo-800' },
    { name: 'Cardiology', icon: '❤️', color: 'bg-red-100 text-red-800' },
    { name: 'Orthopedics', icon: '🦴', color: 'bg-gray-100 text-gray-800' },
    { name: 'ENT Specialist', icon: '👂', color: 'bg-green-100 text-green-800' }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Choose Specialist',
      desc: 'Select from 100+ certified doctors',
      icon: <User className="w-6 h-6" />,
      tech: 'AI Doctor Matching'
    },
    {
      step: 2,
      title: 'Book Appointment',
      desc: '24/7 availability with instant booking',
      icon: <Calendar className="w-6 h-6" />,
      tech: 'Smart Scheduling'
    },
    {
      step: 3,
      title: 'Connect Securely',
      desc: 'End-to-end encrypted consultation',
      icon: <ShieldIcon className="w-6 h-6" />,
      tech: 'Military-grade Encryption'
    },
    {
      step: 4,
      title: 'Get Digital Prescription',
      desc: 'Instant prescription & follow-up',
      icon: <FileText className="w-6 h-6" />,
      tech: 'E-Prescription System'
    }
  ];

  const handleSpecialtyClick = (specialty) => {
    setSelectedSpecialty(specialty);
    setShowDoctorModal(true);
    setSelectedDoctor(null);
    setSelectedTimeSlot(null);
  };

  const handleConsultationStart = async () => {
    if (!selectedDoctor) return;

    try {
      if (selectedPlan === 'video') {
        const call = await initiateVideoCall(selectedDoctor.id);
        setActiveCall(call);
        alert(`Starting encrypted video call with ${selectedDoctor.name}`);
      } else if (selectedPlan === 'phone') {
        const call = await initiatePhoneCall(selectedDoctor.id);
        setActiveCall(call);
        alert(`Initiating phone call with ${selectedDoctor.name}`);
      } else if (selectedPlan === 'chat') {
        const session = await initiateChatSession(selectedDoctor.id);
        setActiveCall(session);
        alert(`Starting encrypted chat with ${selectedDoctor.name}`);
      }
    } catch (error) {
      alert('Failed to start consultation. Please try again.');
    }
  };

  const handleBooking = () => {
    if (selectedDoctor && selectedTimeSlot) {
      setShowBookingModal(true);
      setBookingStep(1);
    }
  };

  const completeBooking = () => {
    alert(`✅ Booking Confirmed!\n\nDoctor: ${selectedDoctor.name}\nTime: ${selectedTimeSlot}\nFee: ${selectedDoctor.fee}\nPatient: ${patientDetails.name}\n\nA confirmation has been sent to your phone.`);
    setShowBookingModal(false);
    setShowDoctorModal(false);
    setPatientDetails({
      name: '',
      age: '',
      gender: '',
      symptoms: '',
      phone: ''
    });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        id: Date.now(),
        text: newMessage,
        sender: 'patient',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setNewMessage('');
      
      // Simulate doctor reply
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: 'Thank you for sharing. Let me review your symptoms.',
          sender: 'doctor',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    }
  };

  const ConnectionIndicator = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'excellent': return 'bg-green-500';
        case 'good': return 'bg-green-400';
        case 'fair': return 'bg-yellow-500';
        case 'poor': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <div className="text-xs font-medium capitalize">{status}</div>
        </div>
        <Wifi className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-8 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-4 md:mb-6 hover:text-blue-100 transition-colors text-sm md:text-base bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
            <div className="mb-4 md:mb-0 md:mr-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2">
                Telemedicine Services
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
                Secure, encrypted consultations with certified doctors. Available 24/7 from anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors, specialties, or symptoms..."
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Filter className="w-5 h-5" />
              <span className="hidden md:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Consultation Plans */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Choose Your Consultation Type
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {consultationTypes.map((type) => (
              <div
                key={type.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                  selectedPlan === type.id ? 'ring-4 ring-blue-500 shadow-2xl' : ''
                }`}
                onClick={() => setSelectedPlan(type.id)}
              >
                {type.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold z-10 shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${type.color} p-6 md:p-8 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="flex items-start justify-between mb-6">
                    {type.logo}
                    <ConnectionIndicator status={connectionStatus} />
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">{type.title}</h3>
                  <div className="flex items-baseline mb-3">
                    <span className="text-4xl md:text-5xl font-bold">{type.price}</span>
                    <span className="text-sm md:text-base ml-2 opacity-90">per session</span>
                  </div>
                  <div className="flex items-center text-base md:text-lg opacity-90">
                    <Clock className="w-5 h-5 mr-2" />
                    {type.duration}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="space-y-4 mb-8">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 mb-2">TECHNOLOGY STACK</p>
                    <div className="flex flex-wrap gap-2">
                      {type.tech.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleConsultationStart}
                    className={`w-full bg-gradient-to-r ${type.color} text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3`}
                  >
                    Start Consultation
                    {type.id === 'video' && <Video className="w-5 h-5" />}
                    {type.id === 'phone' && <Phone className="w-5 h-5" />}
                    {type.id === 'chat' && <MessageSquare className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialties Grid */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Available Specialties
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {specialties.map((specialty, idx) => (
              <div
                key={idx}
                onClick={() => handleSpecialtyClick(specialty.name)}
                className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center cursor-pointer hover:-translate-y-1 active:scale-95"
              >
                <div className={`${specialty.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {specialty.icon}
                </div>
                <p className="text-base md:text-lg font-semibold text-gray-800">{specialty.name}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {doctorsBySpecialty[specialty.name]?.length || 0} doctors available
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works with Tech */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {howItWorks.map((item, idx) => (
              <div
                key={idx}
                className="relative group"
              >
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  <div className="bg-white text-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center mb-4">{item.desc}</p>
                  <div className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full text-center">
                    {item.tech}
                  </div>
                </div>
                
                {idx < howItWorks.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-gray-300 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Consultation Section */}
        {activeCall && (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Active Consultation</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
              </div>
            </div>
            
            {selectedPlan === 'chat' ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-64 overflow-y-auto mb-4 space-y-4">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg max-w-[80%] ${
                        msg.sender === 'patient'
                          ? 'bg-white/20 ml-auto'
                          : 'bg-white/10'
                      }`}
                      style={{
                        marginLeft: msg.sender === 'patient' ? 'auto' : '0',
                        marginRight: msg.sender === 'doctor' ? 'auto' : '0'
                      }}
                    >
                      <div className="text-sm">{msg.text}</div>
                      <div className="text-xs opacity-75 text-right mt-1">{msg.time}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4">Consultation with {selectedDoctor?.name} is active</p>
                <div className="flex justify-center gap-4">
                  {selectedPlan === 'video' && (
                    <>
                      <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Toggle Camera
                      </button>
                      <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Mute
                      </button>
                    </>
                  )}
                  <button className="px-6 py-3 bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2">
                    End Call
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <ShieldIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Secure & Encrypted</h3>
            <p className="text-gray-600">All consultations are end-to-end encrypted with military-grade security.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Device Compatible</h3>
            <p className="text-gray-600">Access from any device - mobile, tablet, or desktop.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Vital Monitoring</h3>
            <p className="text-gray-600">Integrate with health devices for real-time vital monitoring.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-4xl font-bold mb-4">
              Ready to Consult a Doctor?
            </h3>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Book your consultation now and get expert medical advice within minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (selectedSpecialty) {
                    setShowDoctorModal(true);
                  } else {
                    alert('Please select a specialty first');
                  }
                }}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 active:scale-95"
              >
                Book Consultation
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  // Scroll to specialties
                  document.getElementById('specialties')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                View All Doctors
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Modal */}
      {showDoctorModal && selectedSpecialty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedSpecialty} Specialists
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Select a doctor and choose your preferred time slot
                </p>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {doctorsBySpecialty[selectedSpecialty]?.map((doctor, idx) => (
                <div
                  key={idx}
                  className={`mb-6 p-6 border-2 rounded-2xl transition-all cursor-pointer ${
                    selectedDoctor?.id === doctor.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setSelectedTimeSlot(null);
                  }}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                          {doctor.name.split(' ')[1]?.[0] || doctor.name[0]}
                        </div>
                        {doctor.verified && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                            {doctor.name}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-2" />
                            {doctor.hospital}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            doctor.availability === 'online'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {doctor.availability === 'online' ? '● Online' : 'Offline'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-gray-700">{doctor.experience} experience</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                          <span className="font-semibold text-gray-800">{doctor.rating}</span>
                          <span className="text-gray-600 ml-1">({doctor.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <Languages className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-gray-700">{doctor.languages.join(', ')}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-600 text-sm mb-2">{doctor.education}</p>
                        <div className="flex flex-wrap gap-2">
                          {doctor.specializations?.map((spec, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                          <div>
                            <span className="font-bold text-2xl text-green-600">{doctor.fee}</span>
                            <span className="text-gray-600 ml-2">consultation fee</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-blue-600" />
                          <div>
                            <span className="text-blue-600 font-semibold">Next available:</span>
                            <span className="text-gray-800 font-bold ml-2">{doctor.nextAvailable}</span>
                          </div>
                        </div>
                      </div>

                      {selectedDoctor?.id === doctor.id && (
                        <div className="mt-6 p-4 bg-white rounded-xl border border-blue-200">
                          <p className="text-sm font-semibold text-gray-800 mb-4">
                            Select Time Slot:
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {doctor.timeSlots.map((slot, slotIdx) => (
                              <button
                                key={slotIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTimeSlot(slot);
                                }}
                                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                  selectedTimeSlot === slot
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedDoctor && selectedTimeSlot && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-gray-800 font-semibold">
                      Booking {selectedDoctor.name} at {selectedTimeSlot}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Consultation fee: {selectedDoctor.fee}
                    </p>
                  </div>
                  <button
                    onClick={handleBooking}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
                  >
                    Book Now - {selectedDoctor.fee}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">
                Complete Your Booking
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Steps */}
              <div className="flex justify-between mb-8 relative">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step === bookingStep
                        ? 'bg-blue-600 text-white'
                        : step < bookingStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    <span className="text-sm mt-2 font-medium">
                      {step === 1 ? 'Details' : step === 2 ? 'Review' : 'Confirm'}
                    </span>
                  </div>
                ))}
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((bookingStep - 1) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              {bookingStep === 1 && (
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Patient Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.name}
                        onChange={(e) => setPatientDetails({...patientDetails, name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.age}
                        onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})}
                        placeholder="Enter age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.gender}
                        onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.phone}
                        onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptoms (Optional)
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      value={patientDetails.symptoms}
                      onChange={(e) => setPatientDetails({...patientDetails, symptoms: e.target.value})}
                      placeholder="Briefly describe your symptoms..."
                    />
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Review Booking</h4>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="font-semibold">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Specialty:</span>
                      <span className="font-semibold">{selectedSpecialty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Time Slot:</span>
                      <span className="font-semibold">{selectedTimeSlot}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Consultation Type:</span>
                      <span className="font-semibold">
                        {consultationTypes.find(t => t.id === selectedPlan)?.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Patient:</span>
                      <span className="font-semibold">{patientDetails.name}</span>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">{selectedDoctor.fee}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h4>
                  <p className="text-gray-600">
                    Your consultation with {selectedDoctor.name} has been booked for {selectedTimeSlot}
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-2">Meeting Details:</p>
                    <p className="font-mono text-sm bg-white p-3 rounded-lg">
                      Join URL: https://telemed.io/meet/{selectedDoctor.id}-{Date.now()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {bookingStep > 1 && (
                  <button
                    onClick={() => setBookingStep(bookingStep - 1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (bookingStep < 3) {
                      setBookingStep(bookingStep + 1);
                    } else {
                      completeBooking();
                    }
                  }}
                  className={`ml-auto px-8 py-3 rounded-lg font-bold text-white ${
                    bookingStep === 3
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  {bookingStep === 3 ? 'Complete Booking' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Telemedicine;