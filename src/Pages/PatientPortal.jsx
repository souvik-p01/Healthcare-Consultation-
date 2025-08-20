import React, { useState } from 'react';
import { 
  Calendar, 
  Brain, 
  Video, 
  Pill, 
  Ambulance, 
  FileText, 
  BarChart3, 
  Users,
  Home,
  Bell,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const quickActions = [
    { icon: <Calendar className="w-6 h-6" />, title: "Book Appointment", desc: "Schedule with specialists" },
    { icon: <Brain className="w-6 h-6" />, title: "AI Health Check", desc: "Symptom analysis" },
    { icon: <Video className="w-6 h-6" />, title: "Telemedicine", desc: "Video consultations" },
    { icon: <Pill className="w-6 h-6" />, title: "Order Medicine", desc: "Home delivery" },
    { icon: <Ambulance className="w-6 h-6" />, title: "Emergency", desc: "24/7 support" },
    { icon: <FileText className="w-6 h-6" />, title: "Medical Records", desc: "View reports" }
  ];

  const upcomingAppointments = [
    { doctor: "Dr. Sarah Johnson", specialty: "Cardiology", date: "Today, 2:00 PM", type: "Video Call" },
    { doctor: "Dr. Michael Chen", specialty: "General", date: "Tomorrow, 10:00 AM", type: "In-Person" }
  ];

  const handleAnalyzeSymptoms = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert("Analysis complete! Based on your symptoms, we recommend consulting with a general practitioner.");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                <Home className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Patient Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" />
                {notifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation - Hidden on mobile, shown on larger screens */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
                  { id: 'health-ai', label: 'AI Assistant', icon: <Brain className="w-4 h-4" /> },
                  { id: 'records', label: 'Medical Records', icon: <FileText className="w-4 h-4" /> },
                  { id: 'pharmacy', label: 'Pharmacy', icon: <Pill className="w-4 h-4" /> },
                  { id: 'emergency', label: 'Emergency', icon: <Ambulance className="w-4 h-4" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                      activeTab === item.id 
                        ? 'bg-blue-100 text-blue-600 shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile Navigation - Shown on mobile, hidden on larger screens */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
            <div className="grid grid-cols-4 gap-2 p-2">
              {[
                { id: 'dashboard', icon: <BarChart3 className="w-5 h-5 mx-auto" />, label: 'Home' },
                { id: 'appointments', icon: <Calendar className="w-5 h-5 mx-auto" />, label: 'Appts' },
                { id: 'health-ai', icon: <Brain className="w-5 h-5 mx-auto" />, label: 'AI' },
                { id: 'records', icon: <FileText className="w-5 h-5 mx-auto" />, label: 'Records' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                    activeTab === item.id 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600'
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 pb-16 lg:pb-0">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, John!</h2>
                  
                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {quickActions.map((action, index) => (
                      <div 
                        key={index} 
                        className="bg-white p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                        onClick={() => {
                          if (index === 1) setActiveTab('health-ai');
                          else if (index === 0) setActiveTab('appointments');
                        }}
                      >
                        <div className="text-blue-600 mb-3">{action.icon}</div>
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base">{action.title}</h3>
                        <p className="text-gray-500 text-xs md:text-sm">{action.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Upcoming Appointments */}
                  <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Appointments</h3>
                    <div className="space-y-4">
                      {upcomingAppointments.map((apt, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-blue-50 rounded-lg transition-all duration-300 hover:bg-blue-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{apt.doctor}</p>
                            <p className="text-sm text-gray-600">{apt.specialty}</p>
                            <p className="text-sm text-blue-600">{apt.date}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {apt.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health-ai' && (
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Health Assistant</h2>
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 md:p-6 rounded-lg mb-6 animate-pulse">
                    <h3 className="text-xl font-semibold mb-2">How are you feeling today?</h3>
                    <p>Describe your symptoms and get instant AI-powered health insights</p>
                  </div>
                  <textarea 
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Describe your symptoms here..."
                  ></textarea>
                  <button 
                    className={`mt-4 px-6 py-2 rounded-lg text-white transition-all duration-300 ${isAnalyzing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={handleAnalyzeSymptoms}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
                  </button>
                </div>
              </div>
            )}

            {/* Add other tab contents as needed */}
            {activeTab !== 'dashboard' && activeTab !== 'health-ai' && (
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 capitalize">
                  {activeTab.replace('-', ' ')}
                </h2>
                <p className="text-gray-600">This section is under development. More features coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;