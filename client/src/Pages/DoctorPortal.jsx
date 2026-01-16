import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Video, 
  Pill, 
  Brain, 
  Stethoscope,
  Home,
  FileText,
  Bell,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Settings,
  LogOut,
  AlertCircle,
  Menu,
  X,
  Download,
  Eye,
  Edit,
  MessageSquare,
  TrendingUp,
  Activity,
  Heart,
  Thermometer,
  Shield,
  Award,
  Star,
  CheckCircle,
  Plus
} from 'lucide-react';
import AiAssistance from './AIAssistantPage';
import Telemedicine from './services/Telemedicine';
import HealthReports from './services/HealthReports';


const DoctorPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Patient Appointment', desc: 'Jane Smith scheduled for 3:30 PM', time: '10 min ago', read: false },
    { id: 2, title: 'Lab Results Ready', desc: 'Patient John Doe blood test results', time: '1 hour ago', read: false },
    { id: 3, title: 'Prescription Renewal', desc: 'Patient requested medication refill', time: '2 hours ago', read: true }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [doctor] = useState({
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    experience: '12 years',
    rating: 4.8,
    totalPatients: 2450,
    email: 'sarah.johnson@healthcare.com',
    phone: '+91 98765 43210',
    address: 'Main Hospital, Room 405',
    qualifications: ['MD Cardiology', 'MBBS', 'DM Cardiology'],
    availability: 'Mon-Fri: 9 AM - 5 PM',
    nextAvailable: 'Tomorrow, 10:00 AM'
  });

  const todayStats = [
    { 
      label: 'Patients Today', 
      value: '12', 
      icon: Users, 
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+2 from yesterday',
      trend: 'up'
    },
    { 
      label: 'Video Consultations', 
      value: '8', 
      icon: Video, 
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+3 from yesterday',
      trend: 'up'
    },
    { 
      label: 'Prescriptions', 
      value: '15', 
      icon: Pill, 
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+4 from yesterday',
      trend: 'up'
    },
    { 
      label: 'Reports Reviewed', 
      value: '6', 
      icon: FileText, 
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      change: '+1 from yesterday',
      trend: 'up'
    }
  ];

  const upcomingPatients = [
    { 
      id: 1,
      name: 'John Doe', 
      time: '2:00 PM - 2:30 PM', 
      type: 'Video Consultation', 
      condition: 'Cardiac Follow-up',
      status: 'confirmed',
      avatar: 'JD',
      age: 45,
      gender: 'Male',
      bloodType: 'O+',
      notes: 'Regular checkup, no complaints'
    },
    { 
      id: 2,
      name: 'Jane Smith', 
      time: '3:30 PM - 4:00 PM', 
      type: 'In-Person', 
      condition: 'New Patient Consultation',
      status: 'confirmed',
      avatar: 'JS',
      age: 32,
      gender: 'Female',
      bloodType: 'A+',
      notes: 'Heart palpitations, needs ECG'
    },
    { 
      id: 3,
      name: 'Robert Brown', 
      time: '4:15 PM - 4:45 PM', 
      type: 'Video Consultation', 
      condition: 'Post-op Checkup',
      status: 'pending',
      avatar: 'RB',
      age: 58,
      gender: 'Male',
      bloodType: 'B+',
      notes: 'Angioplasty recovery, stable'
    }
  ];

  const recentPatients = [
    { id: 1, name: 'Michael Chen', lastVisit: 'Yesterday', condition: 'Hypertension', status: 'Stable' },
    { id: 2, name: 'Emily Watson', lastVisit: '2 days ago', condition: 'Arrhythmia', status: 'Improved' },
    { id: 3, name: 'David Wilson', lastVisit: '3 days ago', condition: 'Heart Failure', status: 'Monitoring' },
    { id: 4, name: 'Lisa Taylor', lastVisit: '1 week ago', condition: 'Angina', status: 'Stable' }
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'consultations', label: 'Video Consultations', icon: Video },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'ai-assist', label: 'AI Assistant', icon: Brain },
    { id: 'reports', label: 'Medical Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 md:p-6 text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Welcome back, {doctor.name}!</h1>
            <p className="text-blue-100">Your daily overview and patient schedule</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/20 w-full lg:w-auto">
            <div className="flex items-center justify-around lg:justify-start lg:gap-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-blue-200 mb-1">Specialty</p>
                <p className="text-base md:text-lg font-bold">{doctor.specialty}</p>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/30"></div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-blue-200 mb-1">Experience</p>
                <p className="text-base md:text-lg font-bold">{doctor.experience}</p>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/30"></div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-blue-200 mb-1">Rating</p>
                <p className="text-base md:text-lg font-bold">{doctor.rating}/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{stat.label}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-5">
              <h3 className="text-base md:text-lg font-bold text-gray-800">Today's Schedule</h3>
              <button 
                onClick={() => setActiveTab('appointments')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {upcomingPatients.map((patient) => (
                <div 
                  key={patient.id}
                  onClick={() => alert(`Patient details:\nName: ${patient.name}\nTime: ${patient.time}\nType: ${patient.type}\nCondition: ${patient.condition}`)}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {patient.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{patient.name}</p>
                      <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2">{patient.condition}</p>
                      <div className="flex flex-col md:flex-row md:items-center md:gap-3 space-y-1 md:space-y-0">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{patient.time}</span>
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">{patient.age}y • {patient.gender}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 ml-2">
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium rounded-full ${
                      patient.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {patient.status}
                    </span>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('consultations')}
              className="w-full mt-4 py-2 md:py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base font-medium"
            >
              <Video className="w-4 h-4 md:w-5 md:h-5" />
              Start New Consultation
            </button>
          </div>
        </div>

        {/* Recent Patients & Quick Actions */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">Recent Patients</h3>
            <div className="space-y-2 md:space-y-3">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-2 md:p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">{patient.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{patient.condition}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      patient.status === 'Stable' ? 'bg-green-100 text-green-700' :
                      patient.status === 'Improved' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {patient.status}
                    </span>
                    <p className="text-gray-500 text-xs mt-0.5">{patient.lastVisit}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('patients')}
              className="w-full mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1"
            >
              View All Patients <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 md:p-6 text-white">
            <h3 className="text-base md:text-lg font-bold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('prescriptions')}
                className="w-full bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2"
              >
                <Pill className="w-4 h-4" />
                Write Prescription
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className="w-full bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Review Reports
              </button>
              <button 
                onClick={() => setActiveTab('ai-assist')}
                className="w-full bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                AI Diagnostics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PatientsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">My Patients</h2>
            <p className="text-gray-600 text-sm md:text-base">Manage your patient records and history</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              New Patient
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Last Visit</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Condition</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { id: 1, name: 'John Doe', lastVisit: 'Today', condition: 'Hypertension', status: 'Stable', age: 45, gender: 'Male' },
                    { id: 2, name: 'Jane Smith', lastVisit: 'Yesterday', condition: 'Arrhythmia', status: 'Improved', age: 32, gender: 'Female' },
                    { id: 3, name: 'Robert Brown', lastVisit: '2 days ago', condition: 'Heart Failure', status: 'Monitoring', age: 58, gender: 'Male' },
                    { id: 4, name: 'Emily Watson', lastVisit: '3 days ago', condition: 'Angina', status: 'Stable', age: 42, gender: 'Female' },
                    { id: 5, name: 'Michael Chen', lastVisit: '1 week ago', condition: 'Cardiomyopathy', status: 'Critical', age: 50, gender: 'Male' }
                  ].map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm md:text-base font-medium text-gray-800">{patient.name}</div>
                            <div className="text-xs text-gray-500">{patient.age}y • {patient.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{patient.lastVisit}</div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{patient.condition}</div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          patient.status === 'Stable' ? 'bg-green-100 text-green-700' :
                          patient.status === 'Improved' ? 'bg-blue-100 text-blue-700' :
                          patient.status === 'Monitoring' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 md:gap-2">
                          <button 
                            onClick={() => alert(`Viewing ${patient.name}'s profile`)}
                            className="p-1 md:p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                          >
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Editing ${patient.name}'s record`)}
                            className="p-1 md:p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Messaging ${patient.name}`)}
                            className="p-1 md:p-1.5 hover:bg-purple-50 rounded text-purple-600 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
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

  const AppointmentsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Appointments</h2>
            <p className="text-gray-600 text-sm md:text-base">Manage your appointments and schedule</p>
          </div>
          <button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            Schedule Appointment
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { date: 'Today', appointments: upcomingPatients },
            { date: 'Tomorrow', appointments: [
              { id: 4, name: 'Lisa Taylor', time: '10:00 AM - 10:30 AM', type: 'Video Consultation', condition: 'Follow-up' },
              { id: 5, name: 'David Wilson', time: '11:00 AM - 11:45 AM', type: 'In-Person', condition: 'New Consultation' }
            ]},
            { date: 'Day After', appointments: [
              { id: 6, name: 'Michael Chen', time: '9:30 AM - 10:00 AM', type: 'Video Consultation', condition: 'Regular Checkup' }
            ]}
          ].map((day, dayIndex) => (
            <div key={dayIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg mb-3">{day.date}</h3>
              <div className="space-y-3">
                {day.appointments.map((apt, aptIndex) => (
                  <div key={aptIndex} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{apt.name}</p>
                        <p className="text-gray-600 text-sm">{apt.condition}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        apt.type.includes('Video') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {apt.type.split(' ')[0]}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
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
            {/* Professional Information */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={doctor.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={doctor.specialty}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={doctor.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={doctor.phone}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                <textarea 
                  className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  rows="3"
                  defaultValue={doctor.qualifications.join('\n')}
                />
              </div>
              <button 
                onClick={() => alert('Professional information updated successfully!')}
                className="mt-4 md:mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow hover:shadow-md font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Availability Settings */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4">Availability</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    defaultValue={doctor.availability}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Available</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    defaultValue={doctor.nextAvailable}
                  />
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 md:p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                Emergency Settings
              </h3>
              <button 
                onClick={() => alert('Calling emergency backup...')}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 md:py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                Emergency Protocol
              </button>
              <p className="text-xs text-gray-600 mt-2 md:mt-3">
                Activate emergency protocol and notify hospital administration.
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
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Feature Coming Soon</h3>
          <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6 max-w-md mx-auto">
            This feature is currently under development and will be available in the next update.
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
          {/* Doctor Info */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {doctor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm md:text-base truncate">{doctor.name}</p>
                <p className="text-gray-600 text-xs">{doctor.specialty}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Rating</span>
              <span className="font-bold text-yellow-600 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {doctor.rating}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-gray-600">Patients</span>
              <span className="font-bold text-green-600">{doctor.totalPatients}+</span>
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
          
          {/* Logout */}
          <div className="mt-4 md:mt-6">
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
                <h1 className="font-bold text-base md:text-lg text-gray-800 hidden sm:block">Doctor Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search - keep existing */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
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
              
              {/* Doctor Profile */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="text-right hidden md:block">
                  <p className="font-medium text-gray-800 text-sm">{doctor.name.split('Dr. ')[1]}</p>
                  <p className="text-xs text-gray-500">{doctor.specialty}</p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {doctor.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto px-3 md:px-4 pb-16 md:pb-6">
                    <div className="max-w-7xl mx-auto py-4 md:py-6">
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'patients' && <PatientsContent />}
            {activeTab === 'appointments' && <AppointmentsContent />}
            {activeTab === 'consultations' && <Telemedicine role="doctor" />}
            {activeTab === 'ai-assist' && <AiAssistance role="doctor" />}
            {activeTab === 'reports' && <HealthReports role="doctor" />}
            {activeTab === 'settings' && <SettingsContent />}

            {activeTab !== 'dashboard' &&
            activeTab !== 'patients' &&
            activeTab !== 'appointments' &&
            activeTab !== 'consultations' &&
            activeTab !== 'ai-assist' &&
            activeTab !== 'reports' &&
            activeTab !== 'settings' &&
            <OtherTabContent />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
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
    </div>
  );
};

export default DoctorPortal;