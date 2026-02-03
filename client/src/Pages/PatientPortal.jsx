import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Brain, 
  Video, 
  Pill, 
  Ambulance, 
  FileText, 
  BarChart3,
  Bell,
  ChevronRight,
  Search,
  Heart,
  Activity,
  Clock,
  X,
  Menu,
  LogOut,
  Settings,
  Stethoscope,
  TrendingUp,
  Download,
  Plus,
  User,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Thermometer,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AiAssistance from './AIAssistantPage';
import Telemedicine from './services/Telemedicine';
import HealthReports from './services/HealthReports';
import PharmacyPage from './PharmacyPage';
import EmergencyPage from './EmergencyPage';



const PatientPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Appointment Reminder', desc: 'Dr. Sarah Johnson at 2:00 PM', time: '10 min ago', read: false },
    { id: 2, title: 'Lab Results Ready', desc: 'Blood test results available', time: '1 hour ago', read: false },
    { id: 3, title: 'Prescription Refill', desc: 'Medication ready for pickup', time: '2 hours ago', read: true }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('1-3 days');
  const [severity, setSeverity] = useState('Mild');
  
  const [user] = useState({
    name: 'John Doe',
    age: 34,
    bloodType: 'O+',
    lastCheckup: '2024-02-15',
    patientId: 'PT12345',
    healthScore: 85,
    memberSince: 2023,
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    address: 'Bishnupur, West Bengal, India'
  });

  const healthMetrics = [
    { title: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, status: 'normal', change: '+2%' },
    { title: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity, status: 'normal', change: '-1%' },
    { title: 'Blood Sugar', value: '98', unit: 'mg/dL', icon: Activity, status: 'normal', change: '+0%' },
    { title: 'Weight', value: '72', unit: 'kg', icon: TrendingUp, status: 'normal', change: '-0.5%' }
  ];

  const quickActions = [
    { 
      id: 'appointments',
      icon: Calendar, 
      title: "Book Appointment", 
      desc: "Schedule with specialists",
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    { 
      id: 'health-ai',
      icon: Brain, 
      title: "AI Health Check", 
      desc: "Symptom analysis",
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    { 
      id: 'telemedicine',
      icon: Video, 
      title: "Telemedicine", 
      desc: "Video consultations",
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    { 
      id: 'pharmacy',
      icon: Pill, 
      title: "Order Medicine", 
      desc: "Home delivery",
      color: 'bg-gradient-to-br from-red-500 to-red-600'
    },
    { 
      id: 'emergency',
      icon: Ambulance, 
      title: "Emergency", 
      desc: "24/7 support",
      color: 'bg-gradient-to-br from-red-600 to-red-700'
    },
    { 
      id: 'records',
      icon: FileText, 
      title: "Medical Records", 
      desc: "View reports",
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
    }
  ];

  const upcomingAppointments = [
    { 
      id: 1,
      doctor: "Dr. Sarah Johnson", 
      specialty: "Cardiology", 
      date: "Today, 2:00 PM", 
      time: "2:00 PM - 2:30 PM",
      type: "Video Call",
      status: "confirmed",
      avatar: "SJ",
      location: "Virtual Consultation"
    },
    { 
      id: 2,
      doctor: "Dr. Michael Chen", 
      specialty: "General Physician", 
      date: "Tomorrow, 10:00 AM", 
      time: "10:00 AM - 10:45 AM",
      type: "In-Person",
      status: "pending",
      avatar: "MC",
      location: "Main Hospital, Room 302"
    }
  ];

  const recentActivities = [
    { id: 1, activity: "Uploaded lab results", time: "2 hours ago", icon: FileText },
    { id: 2, activity: "Completed health survey", time: "1 day ago", icon: BarChart3 },
    { id: 3, activity: "Prescription renewed", time: "2 days ago", icon: Pill },
    { id: 4, activity: "Insurance updated", time: "3 days ago", icon: Settings }
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'health-ai', label: 'AI Assistant', icon: Brain },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'telemedicine', label: 'Telemedicine', icon: Video },
    { id: 'emergency', label: 'Emergency', icon: Ambulance },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleAnalyzeSymptoms = useCallback(() => {
    if (!symptoms.trim()) {
      alert('Please describe your symptoms first.');
      return;
    }
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const results = {
        condition: "Possible Common Cold",
        severity: "Mild",
        recommendation: "Rest and hydration. Consult if symptoms worsen.",
        suggestedSpecialist: "General Physician",
        urgency: "Non-urgent",
        suggestedActions: [
          "Get plenty of rest",
          "Stay hydrated (8 glasses of water daily)",
          "Consider over-the-counter cold medicine",
          "Monitor temperature"
        ]
      };
      
      alert(`Analysis Complete!\n\nCondition: ${results.condition}\nSeverity: ${results.severity}\nUrgency: ${results.urgency}\n\nRecommendation: ${results.recommendation}\nSuggested Specialist: ${results.suggestedSpecialist}\n\nSuggested Actions:\n${results.suggestedActions.map(action => `• ${action}`).join('\n')}`);
    }, 2000);
  }, [symptoms]);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Welcome Header - This is the blue gradient section that will now scroll */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 md:p-6 text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-blue-100">Your health overview for today</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/20 w-full lg:w-auto">
            <div className="flex items-center justify-around lg:justify-start lg:gap-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-blue-200 mb-1">Age</p>
                <p className="text-base md:text-lg font-bold">{user.age}</p>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/30"></div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-blue-200 mb-1">Blood Type</p>
                <p className="text-base md:text-lg font-bold">{user.bloodType}</p>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/30"></div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-blue-200 mb-1">Health Score</p>
                <p className="text-base md:text-lg font-bold">{user.healthScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Health Metrics</h2>
          <button 
            onClick={() => alert('Detailed health metrics will open in a new view.')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${metric.status === 'normal' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className={`text-xs font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{metric.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-gray-800">{metric.value}</span>
                  <span className="text-gray-500 text-xs md:text-sm">{metric.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className="bg-white rounded-lg shadow p-3 md:p-4 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className={`${action.color} p-2 md:p-3 rounded-lg mb-2 md:mb-3 text-white group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 text-xs md:text-sm mb-0.5">{action.title}</h3>
                <p className="text-gray-500 text-xs">{action.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-5">
              <h3 className="text-base md:text-lg font-bold text-gray-800">Upcoming Appointments</h3>
              <button 
                onClick={() => setActiveTab('appointments')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div 
                  key={apt.id}
                  onClick={() => alert(`Appointment details:\nDoctor: ${apt.doctor}\nTime: ${apt.date} ${apt.time}\nType: ${apt.type}`)}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {apt.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{apt.doctor}</p>
                      <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2">{apt.specialty}</p>
                      <div className="flex flex-col md:flex-row md:items-center md:gap-3 space-y-1 md:space-y-0">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{apt.date} • {apt.time}</span>
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{apt.location}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 ml-2">
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium rounded-full ${
                      apt.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status}
                    </span>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('appointments')}
              className="w-full mt-4 py-2 md:py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base font-medium"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Schedule New Appointment
            </button>
          </div>
        </div>

        {/* Recent Activity & Health Tips */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">Recent Activity</h3>
            <div className="space-y-2 md:space-y-3">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-3 p-2 md:p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg">
                      <Icon className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-sm font-medium truncate">{activity.activity}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 md:p-6 text-white">
            <h3 className="text-base md:text-lg font-bold mb-2">Health Tip of the Day</h3>
            <p className="text-green-100 text-sm mb-3 md:mb-4">
              Stay hydrated! Aim for 8 glasses of water daily to maintain optimal health and energy levels.
            </p>
            <button 
              onClick={() => alert('More health tips will be shown here.')}
              className="bg-white text-green-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-green-50 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // const AIAssistantContent = () => (
  //   <div className="space-y-6">
  //     <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
  //       <div className="mb-5 md:mb-6">
  //         <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">AI Health Assistant</h2>
  //         <p className="text-gray-600 text-sm md:text-base">Describe your symptoms and get AI-powered health insights</p>
  //       </div>
        
  //       <div className="space-y-4 md:space-y-5">
  //         <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 md:p-6 rounded-lg shadow">
  //           <div className="flex items-start md:items-center gap-3 mb-2 md:mb-3">
  //             <Brain className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
  //             <div>
  //               <h3 className="text-lg md:text-xl font-bold">How are you feeling today?</h3>
  //               <p className="text-sm text-purple-100">Our AI can help analyze your symptoms and provide preliminary advice.</p>
  //             </div>
  //           </div>
  //         </div>
          
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">Describe your symptoms</label>
  //           <textarea 
  //             className="w-full p-3 md:p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm md:text-base"
  //             rows="4"
  //             placeholder="Example: Headache for 3 days, mild fever, no cough, feeling tired..."
  //             value={symptoms}
  //             onChange={(e) => setSymptoms(e.target.value)}
  //           />
  //         </div>
          
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
  //             <select 
  //               className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
  //               value={duration}
  //               onChange={(e) => setDuration(e.target.value)}
  //             >
  //               <option>Less than 1 day</option>
  //               <option>1-3 days</option>
  //               <option>3-7 days</option>
  //               <option>More than 1 week</option>
  //             </select>
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
  //             <select 
  //               className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
  //               value={severity}
  //               onChange={(e) => setSeverity(e.target.value)}
  //             >
  //               <option>Mild</option>
  //               <option>Moderate</option>
  //               <option>Severe</option>
  //             </select>
  //           </div>
  //         </div>
          
  //         <button 
  //           className={`w-full px-4 py-3 md:px-6 md:py-4 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow ${
  //             isAnalyzing 
  //               ? 'bg-blue-400 cursor-not-allowed' 
  //               : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-md'
  //           }`}
  //           onClick={handleAnalyzeSymptoms}
  //           disabled={isAnalyzing}
  //         >
  //           {isAnalyzing ? (
  //             <>
  //               <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
  //               Analyzing Symptoms...
  //             </>
  //           ) : (
  //             <>
  //               <Brain className="w-4 h-4 md:w-5 md:h-5" />
  //               Analyze Symptoms with AI
  //             </>
  //           )}
  //         </button>

  //         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
  //           <p className="text-xs md:text-sm text-yellow-800">
  //             <strong>Disclaimer:</strong> This AI assistant provides general health information only and is not a substitute for professional medical advice. Always consult with a healthcare provider for medical concerns.
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
  const AIAssistantContent = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-2">AI Health Assistant</h2>
      <p className="text-gray-600">Describe your symptoms and get AI insights.</p>
    </div>
  </div>
);


  const AppointmentsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Appointments</h2>
            <p className="text-gray-600 text-sm md:text-base">Manage your medical appointments</p>
          </div>
          <button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            New Appointment
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Doctor</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm">
                            {apt.avatar}
                          </div>
                          <div>
                            <div className="text-sm md:text-base font-medium text-gray-800">{apt.doctor}</div>
                            <div className="text-xs text-gray-500">{apt.specialty}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{apt.date}</div>
                        <div className="text-xs text-gray-500">{apt.time}</div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.type === 'Video Call' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {apt.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 md:gap-2">
                          <button 
                            onClick={() => alert(`Viewing appointment with ${apt.doctor}`)}
                            className="p-1 md:p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                          >
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Editing appointment with ${apt.doctor}`)}
                            className="p-1 md:p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Cancelling appointment with ${apt.doctor}`)}
                            className="p-1 md:p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const MedicalRecordsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Medical Records</h2>
            <p className="text-gray-600 text-sm md:text-base">View and manage your medical history</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 md:gap-2 text-sm">
              <Download className="w-3 h-3 md:w-4 md:h-4" />
              Export All
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium text-sm md:text-base">
              Upload New
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            { id: 1, name: 'Blood Test Results', date: '2024-02-10', type: 'Lab Report', doctor: 'Dr. Sarah Johnson' },
            { id: 2, name: 'MRI Scan Report', date: '2024-01-25', type: 'Imaging', doctor: 'Dr. Michael Chen' },
            { id: 3, name: 'Annual Physical Exam', date: '2024-01-15', type: 'General Checkup', doctor: 'Dr. Emily Watson' },
            { id: 4, name: 'Vaccination Record', date: '2023-12-01', type: 'Immunization', doctor: 'Dr. Robert Kim' },
            { id: 5, name: 'X-Ray Report', date: '2023-11-20', type: 'Imaging', doctor: 'Dr. Sarah Johnson' },
            { id: 6, name: 'Prescription History', date: '2023-11-05', type: 'Pharmacy', doctor: 'Dr. Michael Chen' }
          ].map((record) => (
            <div key={record.id} className="bg-gray-50 rounded-lg p-4 md:p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {record.type}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2">{record.name}</h3>
              <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1 md:gap-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {new Date(record.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1 md:gap-2">
                  <User className="w-3 h-3 md:w-4 md:h-4" />
                  {record.doctor}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert(`Viewing ${record.name}`)}
                  className="flex-1 bg-white text-blue-600 border border-blue-600 py-1.5 md:py-2 rounded-lg hover:bg-blue-50 transition-colors text-xs md:text-sm font-medium"
                >
                  View
                </button>
                <button 
                  onClick={() => alert(`Downloading ${record.name}`)}
                  className="flex-1 bg-blue-600 text-white py-1.5 md:py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SettingsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5 md:mb-6">Settings</h2>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={user.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={user.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={user.phone}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={user.bloodType}
                  />
                </div>
              </div>
              <button 
                onClick={() => alert('Changes saved successfully!')}
                className="mt-4 md:mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4">Quick Settings</h3>
              <div className="space-y-3">
                {['Email Notifications', 'SMS Alerts', 'Health Tips'].map((setting) => (
                  <label key={setting} className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700 text-sm md:text-base">{setting}</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" defaultChecked />
                      <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-5"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 md:p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                Emergency Settings
              </h3>
              <button 
                onClick={() => alert('Calling emergency services...')}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 md:py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2"
              >
                <Ambulance className="w-4 h-4 md:w-5 md:h-5" />
                Emergency Call
              </button>
              <p className="text-xs text-gray-600 mt-2 md:mt-3">
                This will immediately contact emergency services and your emergency contacts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const OtherTabContent = () => {
    const currentNavItem = navItems.find(item => item.id === activeTab);
    const Icon = currentNavItem?.icon;
    
    return (
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow">
            {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">Manage your {activeTab.replace('-', ' ')} here</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-sm">
            {Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6 max-w-md mx-auto">
            We're working hard to bring you this feature. It will be available soon!
          </p>
          <button 
            onClick={() => alert('You will be notified when this feature is available!')}
            className="px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium"
          >
            Get Notified
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`w-64 bg-white border-r border-gray-200 z-30
          fixed lg:static top-0 bottom-0
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* User Info */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm md:text-base truncate">{user.name}</p>
                <p className="text-gray-600 text-xs">Patient ID: {user.patientId}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Health Score</span>
              <span className="font-bold text-green-600">{user.healthScore}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-1.5 md:h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 md:h-2 rounded-full" 
                style={{width: `${user.healthScore}%`}}
              ></div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-left transition-all duration-300 text-sm md:text-base ${
                    activeTab === item.id 
                      ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-md ${activeTab === item.id ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {activeTab === item.id && <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>
          
          {/* Emergency & Logout */}
          <div className="mt-4 md:mt-6 space-y-2">
            <button 
              onClick={() => {
                setActiveTab('emergency');
                setIsSidebarOpen(false);
              }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 md:py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm font-medium text-sm md:text-base flex items-center justify-center gap-2"
            >
              <Ambulance className="w-3 h-3 md:w-4 md:h-4" />
              Emergency Help
            </button>
            <button 
              onClick={() => alert('Logging out...')}
              className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm md:text-base"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Now includes header */}
      <main className="flex-1 min-h-0 flex flex-col">
        {/* Header - Now part of the scrollable area, NOT fixed */}
        <header className="bg-white shadow h-14 md:h-16 border-b border-gray-200 flex-shrink-0">
          <div className="w-full h-full flex items-center justify-between px-3 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Stethoscope className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h1 className="font-bold text-base md:text-lg text-gray-800 hidden sm:block">Patient Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search - keep existing */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search appointments, doctors..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 md:w-56 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button className="md:hidden p-1.5 hover:bg-gray-100 rounded transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Notifications - keep existing */}
              <div className="relative notifications-container">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-3 md:px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Notifications</h3>
                      {unreadNotifications > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 md:max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                              !notif.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notif.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 text-xs md:text-sm">{notif.title}</p>
                                <p className="text-gray-600 text-xs mt-0.5">{notif.desc}</p>
                                <p className="text-gray-500 text-xs mt-1">{notif.time}</p>
                              </div>
                              {!notif.read && (
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Profile - keep existing */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="text-right hidden md:block">
                  <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">ID: {user.patientId}</p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 pb-16 md:pb-6">
          <div className="max-w-7xl mx-auto py-4 md:py-6">
            {/* Your tab content components */}
            {/* Your tab content components */}
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'health-ai' && <AIAssistantContent />}
          {activeTab === 'appointments' && <AppointmentsContent />}
          {activeTab === 'records' && <MedicalRecordsContent />}
          {activeTab === 'ai-analysis' && <AiAssistance role="patient" />}
          {activeTab === 'settings' && <SettingsContent />}            
            {/* Your tab content components */}
            {activeTab === 'dashboard' && <DashboardContent />}

            {activeTab === 'health-ai' && <AiAssistance role="patient" />}

            {activeTab === 'appointments' && <AppointmentsContent />}

            {activeTab === 'records' && <HealthReports role="patient" />}

            {activeTab === 'pharmacy' && <PharmacyPage role="patient" />}

            {activeTab === 'telemedicine' && <Telemedicine role="patient" />}

            {activeTab === 'emergency' && <EmergencyPage role="patient" />}

            {activeTab === 'settings' && <SettingsContent />}

            {![
              'dashboard',
              'health-ai',
              'appointments',
              'records',
              'pharmacy',
              'telemedicine',
              'emergency',
              'settings'
            ].includes(activeTab) && <OtherTabContent />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - keep as is */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 lg:hidden">
        <div className="grid grid-cols-5 p-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-1.5 rounded transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-md ${activeTab === item.id ? 'bg-blue-100' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs mt-0.5">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Emergency Floating Button for Mobile */}
      <button 
        onClick={() => {
          setActiveTab('emergency');
        }}
        className="fixed bottom-16 right-3 lg:hidden w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full shadow-lg flex items-center justify-center hover:from-red-700 hover:to-red-800 transition-all z-30"
      >
        <Ambulance className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PatientPortal;