import React, { useState } from 'react';
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
  Stethoscope
} from 'lucide-react';

const Telemedicine = () => {
  const [selectedPlan, setSelectedPlan] = useState('video');

  const consultationTypes = [
    {
      id: 'video',
      title: 'Video Consultation',
      icon: <Video className="w-8 h-8" />,
      price: '₹499',
      duration: '30 minutes',
      features: [
        'Face-to-face consultation',
        'Screen sharing for reports',
        'Recorded session (optional)',
        'Digital prescription',
        'Follow-up chat support'
      ],
      popular: true,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'phone',
      title: 'Phone Consultation',
      icon: <Phone className="w-8 h-8" />,
      price: '₹299',
      duration: '20 minutes',
      features: [
        'Voice call consultation',
        'Quick medical advice',
        'Digital prescription',
        'SMS follow-up',
        'Email report summary'
      ],
      popular: false,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'chat',
      title: 'Chat Consultation',
      icon: <MessageSquare className="w-8 h-8" />,
      price: '₹199',
      duration: '24 hour access',
      features: [
        'Text-based consultation',
        'Share images/documents',
        'Asynchronous responses',
        'Chat history saved',
        'Budget-friendly option'
      ],
      popular: false,
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  const specialties = [
    'General Physician',
    'Dermatology',
    'Pediatrics',
    'Gynecology',
    'Psychiatry',
    'Cardiology',
    'Orthopedics',
    'ENT Specialist'
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Choose Specialist',
      desc: 'Select your preferred doctor and specialty',
      icon: <User className="w-6 h-6" />
    },
    {
      step: 2,
      title: 'Book Appointment',
      desc: 'Pick a convenient time slot',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      step: 3,
      title: 'Connect Online',
      desc: 'Join via video, phone, or chat',
      icon: <Video className="w-6 h-6" />
    },
    {
      step: 4,
      title: 'Get Prescription',
      desc: 'Receive digital prescription instantly',
      icon: <FileText className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-6 hover:text-blue-100 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex items-center mb-4">
            <Video className="w-10 h-10 md:w-12 md:h-12 mr-4" />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              Telemedicine Services
            </h1>
          </div>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
            Connect with certified doctors from the comfort of your home. Get expert medical advice through video, phone, or chat consultations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Consultation Plans */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Choose Your Consultation Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {consultationTypes.map((type) => (
              <div
                key={type.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all hover:-translate-y-2 ${
                  selectedPlan === type.id ? 'ring-4 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPlan(type.id)}
              >
                {type.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${type.color} p-6 text-white`}>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl inline-block mb-4">
                    {type.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{type.title}</h3>
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold">{type.price}</span>
                    <span className="text-sm ml-2 opacity-90">per session</span>
                  </div>
                  <div className="flex items-center text-sm opacity-90">
                    <Clock className="w-4 h-4 mr-1" />
                    {type.duration}
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`w-full bg-gradient-to-r ${type.color} text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95`}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            Available Specialties
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specialties.map((specialty, idx) => (
              <div
                key={idx}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center cursor-pointer hover:scale-105"
              >
                <Stethoscope className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm md:text-base font-medium text-gray-700">{specialty}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {howItWorks.map((item, idx) => (
              <div
                key={idx}
                className="relative text-center"
              >
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                
                {idx < howItWorks.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          
          <h3 className="text-2xl md:text-4xl font-bold mb-4 relative z-10">
            Ready to Consult a Doctor?
          </h3>
          <p className="text-lg md:text-xl mb-8 text-white text-opacity-90 max-w-2xl mx-auto relative z-10">
            Book your consultation now and get expert medical advice within minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              Book Consultation <Zap className="w-5 h-5" />
            </button>
            <button
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              View Doctors <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Telemedicine;