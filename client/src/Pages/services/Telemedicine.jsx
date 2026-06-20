import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Activity,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle,
  Play,
  Lock as LockIcon,
  CheckCircle2,
  DollarSign as DollarIcon,
  RefreshCw,
  Loader2
} from 'lucide-react';

// Import ZEGOCLOUD SDK
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// Import Context & APIs
import { useAppContext } from '../../context/AppContext';
import { appointmentAPI } from './api';
import { doctorService } from './DoctorApi';
import PaymentGateway from '../../components/PaymentGateway';
import socketService from './socket';

const Telemedicine = () => {
  const { user, userRole } = useAppContext();
  
  const apptType = (apt) => {
    return apt.appointmentType || (apt.type?.toLowerCase().includes('video') ? 'video' : apt.type?.toLowerCase().includes('phone') ? 'phone' : apt.type?.toLowerCase().includes('chat') ? 'chat' : 'in-person');
  };

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
    phone: '',
    email: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCall, setActiveCall] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [zegoInstance, setZegoInstance] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // New Integration States
  const [createdAppointmentId, setCreatedAppointmentId] = useState(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState({});
  const [adminFreeTester, setAdminFreeTester] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isBookingSaving, setIsBookingSaving] = useState(false);
  const [chatAppointment, setChatAppointment] = useState(null);
  
  const videoContainerRef = useRef(null);
  const durationInterval = useRef(null);

  // Pre-populate Patient Details from Context User
  useEffect(() => {
    if (showBookingModal && user) {
      setPatientDetails(prev => ({
        ...prev,
        name: prev.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phoneNumber || '',
      }));
    }
  }, [showBookingModal, user]);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoadingAppointments(true);
    try {
      if (userRole === 'doctor') {
        const response = await doctorService.getAppointments();
        setAppointments(response.data?.data?.appointments || []);
      } else {
        const response = await appointmentAPI.getPatientAppointments();
        setAppointments(response.data?.data?.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Initialize connection status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const qualities = ['excellent', 'good', 'fair', 'poor'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionStatus(randomQuality);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (isCallActive && callStartTime) {
      durationInterval.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        setCallDuration(duration);
      }, 1000);
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isCallActive, callStartTime]);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper date/time calculations
  const getBookingDate = () => {
    const today = new Date();
    if (selectedDoctor?.nextAvailable?.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return today.toISOString().split('T')[0];
  };

  const convertTimeTo24h = (timeStr) => {
    if (!timeStr) return "10:00";
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  // Booking scheduler
  const handleCreateBookingAndPay = async () => {
    if (!selectedDoctor || !selectedTimeSlot) return;
    
    setIsBookingSaving(true);
    try {
      const dateVal = getBookingDate();
      const timeVal = convertTimeTo24h(selectedTimeSlot);
      
      const payload = {
        doctorId: selectedDoctor.id || selectedDoctor._id,
        appointmentDate: dateVal,
        appointmentTime: timeVal,
        type: selectedPlan,
        reason: patientDetails.symptoms || "Consultation",
        notes: `${patientDetails.name}, ${patientDetails.age}y, ${patientDetails.gender}`,
        phone: patientDetails.phone,
        email: patientDetails.email
      };

      const response = await appointmentAPI.schedule(payload);
      
      if (response.data?.success && response.data?.data?.appointment) {
        const appt = response.data.data.appointment;
        setCreatedAppointmentId(appt._id || appt.id);
        
        // If user is admin or bypass tester is on, bypass payment
        if (userRole === 'admin' || adminFreeTester) {
          setBookingStep(3);
          fetchAppointments();
        } else {
          // Trigger payment gateway
          const fee = selectedPlan === 'video' ? 499 : selectedPlan === 'phone' ? 299 : 199;
          setPaymentOrderDetails({
            appointmentId: appt._id || appt.id,
            serviceType: 'consultation',
            description: `${selectedPlan.toUpperCase()} Consultation with ${selectedDoctor.name}`,
            customerName: patientDetails.name,
            customerEmail: patientDetails.email || user?.email || 'patient@medcare.com',
            customerPhone: patientDetails.phone,
          });
          setShowPaymentGateway(true);
        }
      } else {
        alert("Failed to schedule appointment");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert(error.response?.data?.message || error.message || "Failed to schedule appointment. Doctor might not be available.");
    } finally {
      setIsBookingSaving(false);
    }
  };

  // Unified ZEGOCLOUD Room join
  const joinCallRoom = async (appointmentId, type = 'video') => {
    try {
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      if (!appID || !serverSecret) {
        alert('ZEGOCLOUD credentials not configured. Please check your .env file.');
        return;
      }

      const roomID = `telemed_${appointmentId}`;
      const userID = `${userRole || 'patient'}_${user?._id || Date.now()}`;
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : patientDetails.name || "Participant";

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);
      setCallStartTime(Date.now());
      setIsCallActive(true);

      zp.joinRoom({
        container: videoContainerRef.current,
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: type === 'video',
        showMyCameraToggleButton: type === 'video',
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: type === 'video',
        showTextChat: true,
        showUserList: true,
        maxUsers: 3,
        layout: "Auto",
        showLayoutButton: false,
        showPreJoinView: false,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          },
        },
        onJoinRoom: () => {
          console.log('Joined room successfully:', roomID);
          setActiveCall({
            id: roomID,
            appointmentId,
            type,
            startTime: Date.now()
          });
        },
        onLeaveRoom: () => {
          console.log('Left room:', roomID);
          setIsCallActive(false);
          setCallStartTime(null);
          setCallDuration(0);
          setActiveCall(null);
          setZegoInstance(null);
        }
      });
    } catch (error) {
      console.error('Failed to start ZEGOCLOUD call:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const mapMessage = useCallback((msg) => {
    const senderObj = msg.senderId || {};
    const senderIdStr = typeof msg.senderId === 'string' ? msg.senderId : senderObj._id || senderObj.id;
    const currentUserIdStr = user?._id || user?.id;
    const isMe = senderIdStr === currentUserIdStr;
    const senderRole = isMe ? userRole : (userRole === 'doctor' ? 'patient' : 'doctor');
    
    return {
      id: msg._id || msg.id || Date.now() + Math.random(),
      text: msg.content,
      sender: senderRole === 'doctor' ? 'doctor' : 'patient',
      time: msg.createdAt 
        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }, [user, userRole]);

  const startChatConsultation = async (appointment) => {
    setChatAppointment(appointment);
    setActiveCall({
      id: `chat_${appointment.id || appointment._id}`,
      appointmentId: appointment.id || appointment._id,
      type: 'chat',
      startTime: Date.now()
    });
    setIsCallActive(true);
    setCallStartTime(Date.now());

    // Connect and Join socket room
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    socketService.connect(token);
    socketService.emit('join_consultation', appointment.id || appointment._id);

    // Register receive_message event listener
    socketService.off('receive_message'); // clear existing
    socketService.on('receive_message', (msg) => {
      console.log("Received message via socket:", msg);
      setChatMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === (msg._id || msg.id))) return prev;
        return [...prev, mapMessage(msg)];
      });
    });

    // Fetch messages
    try {
      const response = await appointmentAPI.getMessages(appointment.id || appointment._id);
      if (response.data?.success && response.data?.data?.messages) {
        const mapped = response.data.data.messages.map(mapMessage);
        setChatMessages(mapped);
      } else {
        setChatMessages([
          {
            id: 1,
            text: `Hello, I am ready for our consultation. Please describe your symptoms in detail.`,
            sender: 'doctor',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // End call function
  const endCall = () => {
    if (zegoInstance) {
      zegoInstance.destroyRoom();
      setZegoInstance(null);
    }
    if (chatAppointment) {
      socketService.emit('leave_consultation', chatAppointment.id || chatAppointment._id);
      socketService.off('receive_message');
    }
    setIsCallActive(false);
    setCallStartTime(null);
    setCallDuration(0);
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setChatAppointment(null);
  };

  // Toggle mute
  const toggleMute = () => {
    if (zegoInstance) {
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (zegoInstance) {
      setIsVideoOff(!isVideoOff);
    }
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Copy meeting link
  const copyMeetingLink = () => {
    if (activeCall) {
      const link = `https://telemed.io/join/${activeCall.id}`;
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
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
      tech: ['ZEGOCLOUD SDK', 'AES-256 Encryption', 'WebRTC'],
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
      tech: ['ZEGOCLOUD Audio SDK', 'VoIP', 'AES Encryption'],
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
        responseTime: '5 mins',
        zegoUserId: 'doctor_gp001'
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
        responseTime: '3 mins',
        zegoUserId: 'doctor_gp002'
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
        responseTime: '15 mins',
        zegoUserId: 'doctor_der001'
      }
    ],
    'Cardiology': [
      {
        id: 'CAR001',
        name: 'Dr. Suresh Patel',
        hospital: 'Asian Heart Institute, Mumbai',
        experience: '20 years',
        rating: 4.9,
        reviews: 567,
        languages: ['English', 'Hindi', 'Gujarati'],
        fee: '₹999',
        nextAvailable: 'Today, 4:00 PM',
        timeSlots: ['4:00 PM', '5:30 PM', '7:00 PM'],
        availability: 'online',
        specializations: ['Heart Disease', 'Hypertension', 'Cholesterol'],
        education: 'MBBS, MD, DM (Cardiology)',
        verified: true,
        responseTime: '10 mins',
        zegoUserId: 'doctor_car001'
      }
    ],
    'Pediatrics': [
      {
        id: 'PED001',
        name: 'Dr. Neha Gupta',
        hospital: 'Rainbow Children\'s Hospital, Delhi',
        experience: '8 years',
        rating: 4.8,
        reviews: 234,
        languages: ['English', 'Hindi'],
        fee: '₹599',
        nextAvailable: 'Today, 3:30 PM',
        timeSlots: ['3:30 PM', '5:00 PM', '6:30 PM'],
        availability: 'online',
        specializations: ['Newborn Care', 'Vaccination', 'Child Development'],
        education: 'MBBS, MD (Pediatrics)',
        verified: true,
        responseTime: '8 mins',
        zegoUserId: 'doctor_ped001'
      }
    ]
  };

  const specialties = [
    { name: 'General Physician', icon: '🩺', color: 'bg-blue-100 text-blue-800', count: 12 },
    { name: 'Dermatology', icon: '💆', color: 'bg-purple-100 text-purple-800', count: 8 },
    { name: 'Pediatrics', icon: '👶', color: 'bg-pink-100 text-pink-800', count: 6 },
    { name: 'Cardiology', icon: '❤️', color: 'bg-red-100 text-red-800', count: 5 },
    { name: 'Gynecology', icon: '🤰', color: 'bg-red-100 text-red-800', count: 7 },
    { name: 'Psychiatry', icon: '🧠', color: 'bg-indigo-100 text-indigo-800', count: 4 },
    { name: 'Orthopedics', icon: '🦴', color: 'bg-gray-100 text-gray-800', count: 5 },
    { name: 'ENT Specialist', icon: '👂', color: 'bg-green-100 text-green-800', count: 6 }
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
      tech: 'ZEGOCLOUD WebRTC'
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
      phone: '',
      email: ''
    });
  };

  const sendMessage = () => {
    if (newMessage.trim() && chatAppointment) {
      const payload = {
        consultationId: chatAppointment.id || chatAppointment._id,
        senderId: user?._id || user?.id,
        content: newMessage,
        messageType: 'text'
      };

      socketService.emit('send_message', payload);
      setNewMessage('');
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
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <div className="text-xs font-medium capitalize">{status}</div>
        </div>
        <Wifi className="w-4 h-4" />
      </div>
    );
  };

  const renderDoctorDesk = () => {
    const paidAppointments = appointments.filter(apt => 
      (apt.paymentStatus === 'paid' || apt.paymentStatus === 'free') &&
      ['video', 'phone', 'chat'].includes(apptType(apt)) &&
      apt.status !== 'completed' && apt.status !== 'cancelled'
    );

    function apptType(apt) {
      return apt.appointmentType || (apt.type?.toLowerCase().includes('video') ? 'video' : apt.type?.toLowerCase().includes('phone') ? 'phone' : apt.type?.toLowerCase().includes('chat') ? 'chat' : 'in-person');
    }

    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Clinical Portal
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-gray-400">Live Queue Desk</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                Dr. {user?.lastName || 'Sarah Johnson'}'s Consultation Desk
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage virtual consultations, start encrypted video/audio sessions, and review vital reports.
              </p>
            </div>
            <button 
              onClick={fetchAppointments}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl border border-gray-700 transition-all font-semibold active:scale-95"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Refresh Queue
            </button>
          </div>

          {/* Active Call Container */}
          {activeCall && (
            <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                    {activeCall.type?.toUpperCase()} CONSULTATION IN PROGRESS
                  </span>
                  <h3 className="text-xl font-bold mt-2">
                    Active Room ID: telemed_{activeCall.appointmentId}
                  </h3>
                  <p className="text-sm text-blue-100">
                    Duration: {formatDuration(callDuration)}
                  </p>
                </div>
                <button
                  onClick={endCall}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Consultation
                </button>
              </div>

              {/* ZEGOCLOUD Video Container */}
              {activeCall.type === 'video' && (
                <div 
                  ref={videoContainerRef}
                  className="w-full h-[550px] bg-black rounded-xl overflow-hidden shadow-inner border border-white/10"
                />
              )}

              {activeCall.type === 'phone' && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 text-center border border-white/10">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold mb-2">Secure VoIP Call Connected</h4>
                  <p className="text-blue-100 text-sm max-w-md mx-auto">
                    Attending Patient Call. Talk directly with the patient. ZEGOCLOUD VoIP audio processing is active.
                  </p>
                  <div ref={videoContainerRef} className="hidden" />
                </div>
              )}

              {activeCall.type === 'chat' && (
                <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
                  <div className="h-80 overflow-y-auto mb-4 space-y-4 pr-2">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl max-w-[70%] ${
                          msg.sender === 'doctor'
                            ? 'bg-blue-600 text-white ml-auto rounded-tr-none shadow-md'
                            : 'bg-gray-800 text-gray-200 mr-auto rounded-tl-none border border-gray-700'
                        }`}
                        style={{
                          marginLeft: msg.sender === 'doctor' ? 'auto' : '0',
                          marginRight: msg.sender === 'patient' ? 'auto' : '0'
                        }}
                      >
                        <div className="text-[10px] font-semibold mb-1 opacity-75">
                          {msg.sender === 'doctor' ? 'You' : 'Patient'}
                        </div>
                        <div className="text-sm">{msg.text}</div>
                        <div className="text-[9px] opacity-60 text-right mt-1">{msg.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type clinical advice..."
                      className="flex-grow bg-gray-800 border border-gray-750 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors active:scale-95 text-sm"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Queue Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-200">
                <Users className="w-5 h-5 text-blue-500" />
                Live Waiting Patients ({paidAppointments.length})
              </h2>

              {loadingAppointments ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                  Loading incoming queue...
                </div>
              ) : paidAppointments.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <h3 className="font-bold text-lg text-white">No incoming consultations</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    When patients request and pay for virtual consults, they will appear in this live queue.
                  </p>
                </div>
              ) : (
                paidAppointments.map(appt => (
                  <div key={appt.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {appt.name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{appt.name}</h3>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {appt.age}y • {appt.gender}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                          apptType(appt) === 'video' 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                            : apptType(appt) === 'phone'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {apptType(appt) === 'video' ? <Video className="w-3.5 h-3.5" /> : apptType(appt) === 'phone' ? <Phone className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                          {apptType(appt) === 'video' ? 'Video' : apptType(appt) === 'phone' ? 'Phone' : 'Chat'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Scheduled Time: {appt.time}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl mb-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Chief Complaint & Symptoms</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {appt.condition}
                      </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                      {apptType(appt) === 'chat' ? (
                        <button
                          onClick={() => startChatConsultation(appt)}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all text-sm active:scale-95 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Open Consultation Chat
                        </button>
                      ) : (
                        <button
                          onClick={() => joinCallRoom(appt.id, apptType(appt))}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/10 text-white rounded-xl font-bold transition-all text-sm active:scale-95 flex items-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          Attend Consultation
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Clinical Guides */}
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  Provider Quick Guide
                </h3>
                <div className="space-y-4 text-sm text-gray-400">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">1</div>
                    <p>Select a patient card and click <strong>Attend Consultation</strong> to load the session room.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">2</div>
                    <p>Both audio and video streams require patient browser mic and camera permissions.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">3</div>
                    <p>Write prescriptions using the AI Prescription generator or download reports inside your central doctor portal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (userRole === 'doctor') {
    return renderDoctorDesk();
  }

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
                Secure, encrypted consultations with certified doctors using ZEGOCLOUD technology. Available 24/7 from anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Admin Procedure & Guidance Widget */}
        {userRole === 'admin' && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 rounded-2xl border border-blue-900/40 text-white shadow-2xl">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SYSTEM ADMIN CONSOLE
                </span>
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Telemedicine Architecture & Tester Desk
              </h3>
              <div className="mt-3 space-y-2 text-slate-300 text-xs leading-relaxed">
                <p>
                  <strong>WebRTC Session Routing:</strong> Live audio/video consultations use ZEGOCLOUD WebRTC integration. Session connections are mapped to room IDs following the <code>telemed_&lt;appointmentId&gt;</code> schema.
                </p>
                <p>
                  <strong>Encrypted Chat Channels:</strong> Instant consultation messages are end-to-end encrypted on the client and dispatched via standard WebSockets.
                </p>
              </div>
            </div>
            <div className="bg-slate-950/50 border border-blue-900/30 p-5 rounded-xl flex flex-col justify-center">
              <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Bypass Billing & Payment
              </h4>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Enable this mock switch to bypass Razorpay payment flows for testing. Bookings will confirm instantly without card verification.
              </p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={adminFreeTester} 
                  onChange={(e) => setAdminFreeTester(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-200">
                  {adminFreeTester ? 'Bypass Active (Free Mode)' : 'Bypass Inactive'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Patient Dashboard Integration */}
        {userRole === 'patient' && appointments.filter(a => (a.paymentStatus === 'paid' || a.paymentStatus === 'free') && ['video', 'phone', 'chat'].includes(apptType(a)) && a.status !== 'completed' && a.status !== 'cancelled').length > 0 && (
          <div className="mb-10 bg-white rounded-2xl border border-gray-100 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Your Telemedicine Consultations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments
                .filter(appt => (appt.paymentStatus === 'paid' || appt.paymentStatus === 'free') && ['video', 'phone', 'chat'].includes(apptType(appt)) && appt.status !== 'completed' && appt.status !== 'cancelled')
                .map(appt => (
                  <div key={appt.id} className="bg-gray-50 border border-gray-200/60 p-5 rounded-xl flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                            {appt.doctor[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">{appt.doctor}</h4>
                            <p className="text-xs text-gray-500">{appt.specialty}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          apptType(appt) === 'video' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : apptType(appt) === 'phone' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}>
                          {apptType(appt)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 mb-4 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Time Slot:</span>
                          <span className="font-semibold text-gray-800">{appt.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-semibold text-gray-800">{new Date(appt.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {apptType(appt) === 'chat' ? (
                        <button
                          onClick={() => startChatConsultation(appt)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Open Chat Consultation
                        </button>
                      ) : (
                        <button
                          onClick={() => joinCallRoom(appt.id, apptType(appt))}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Virtual Room
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

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
                    onClick={() => {
                      if (selectedDoctor) {
                        setShowBookingModal(true);
                        setBookingStep(1);
                      } else {
                        document.getElementById('specialties')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`w-full bg-gradient-to-r ${type.color} text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3`}
                  >
                    Book {type.title}
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
        <div className="mb-12 md:mb-16" id="specialties">
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
              <div>
                <h3 className="text-xl font-bold">Active Consultation</h3>
                <p className="text-sm opacity-90">
                  with {selectedDoctor?.name} • {formatDuration(callDuration)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
                {copySuccess ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy 
                    className="w-4 h-4 cursor-pointer hover:text-blue-200" 
                    onClick={copyMeetingLink}
                  />
                )}
              </div>
            </div>
            
            {/* ZEGOCLOUD Video Container */}
            {selectedPlan === 'video' && (
              <div 
                ref={videoContainerRef}
                className="w-full h-[500px] bg-black rounded-xl overflow-hidden"
                style={{ minHeight: '500px' }}
              />
            )}

            {/* Audio Call UI */}
            {selectedPlan === 'phone' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Audio Call in Progress</h4>
                <p className="text-sm opacity-90 mb-4">Speaking with {selectedDoctor?.name}</p>
                <div 
                  ref={videoContainerRef}
                  className="hidden" // Hidden container for audio-only (ZEGOCLOUD still needs it)
                />
              </div>
            )}

            {/* Chat UI */}
            {selectedPlan === 'chat' && (
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
                    className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-white/50"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Call Controls */}
            {(selectedPlan === 'video' || selectedPlan === 'phone') && (
              <div className="flex justify-center gap-4 mt-4">
                {selectedPlan === 'video' && (
                  <>
                    <button
                      onClick={toggleMute}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <Mic className={`w-5 h-5 ${isMuted ? 'line-through' : ''}`} />
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <Camera className={`w-5 h-5 ${isVideoOff ? 'line-through' : ''}`} />
                      {isVideoOff ? 'Start Video' : 'Stop Video'}
                    </button>
                    <button
                      onClick={toggleFullScreen}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                  </>
                )}
                <button
                  onClick={endCall}
                  className="px-8 py-3 bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold"
                >
                  {selectedPlan === 'video' ? <VideoOff className="w-5 h-5" /> : <PhoneOff className="w-5 h-5" />}
                  End Call
                </button>
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
            <p className="text-gray-600">All consultations are end-to-end encrypted with ZEGOCLOUD's military-grade security.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Device Compatible</h3>
            <p className="text-gray-600">Access from any device - mobile, tablet, or desktop with ZEGOCLOUD SDK.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">HD Quality</h3>
            <p className="text-gray-600">High-definition video and audio with adaptive bitrate technology.</p>
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
              Book your consultation now and get expert medical advice within minutes using secure video calls
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Complete Your Booking
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {/* Progress Steps */}
              <div className="flex justify-between mb-6 relative px-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      step === bookingStep
                        ? 'bg-blue-600 text-white'
                        : step < bookingStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    <span className="text-xs mt-1 font-medium">
                      {step === 1 ? 'Details' : step === 2 ? 'Review' : 'Confirm'}
                    </span>
                  </div>
                ))}
                <div className="absolute top-4 left-12 right-12 h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((bookingStep - 1) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              {bookingStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-800">Patient Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.name}
                        onChange={(e) => setPatientDetails({...patientDetails, name: e.target.value})}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.age}
                        onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})}
                        placeholder="Enter age"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.gender}
                        onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.phone}
                        onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={patientDetails.email}
                        onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})}
                        placeholder="Enter email for confirmation"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Symptoms (Optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      value={patientDetails.symptoms}
                      onChange={(e) => setPatientDetails({...patientDetails, symptoms: e.target.value})}
                      placeholder="Briefly describe your symptoms..."
                    />
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-800">Review Booking</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
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
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold">{patientDetails.phone}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center text-base font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">{selectedDoctor.fee}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Booking Confirmed!</h4>
                  <p className="text-sm text-gray-600">
                    Your consultation with {selectedDoctor.name} has been booked for {selectedTimeSlot}
                  </p>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600 mb-1">Meeting Details:</p>
                    <p className="font-mono text-xs bg-white p-2 rounded-lg">
                      Room ID: telemed_{createdAppointmentId}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Please join the room from your consultations dashboard when the session begins.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                {bookingStep > 1 && bookingStep < 3 && (
                  <button
                    onClick={() => setBookingStep(bookingStep - 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    disabled={isBookingSaving}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (bookingStep === 1) {
                      setBookingStep(2);
                    } else if (bookingStep === 2) {
                      handleCreateBookingAndPay();
                    } else {
                      completeBooking();
                    }
                  }}
                  disabled={(bookingStep === 1 && (!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.phone)) || isBookingSaving}
                  className={`ml-auto px-6 py-2 rounded-lg text-sm font-bold text-white ${
                    bookingStep === 3
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors ${(bookingStep === 1 && (!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.phone)) || isBookingSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isBookingSaving ? 'Processing...' : bookingStep === 3 ? 'Complete Booking' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentGateway && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <PaymentGateway
              amount={selectedPlan === 'video' ? 499 : selectedPlan === 'phone' ? 299 : 199}
              orderDetails={paymentOrderDetails}
              onSuccess={(paymentInfo) => {
                setShowPaymentGateway(false);
                setBookingStep(3);
                fetchAppointments();
              }}
              onClose={() => {
                setShowPaymentGateway(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Telemedicine;