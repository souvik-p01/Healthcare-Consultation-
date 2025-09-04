import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Video, 
  Pill, 
  Brain, 
  Stethoscope,
  Home,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const todayStats = [
    { label: 'Patients Today', value: '12', icon: <Users className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Video Calls', value: '8', icon: <Video className="w-5 h-5" />, color: 'bg-green-100 text-green-600' },
    { label: 'Prescriptions', value: '15', icon: <Pill className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600' },
    { label: 'Reports', value: '6', icon: <FileText className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' }
  ];

  const upcomingPatients = [
    { name: 'John Doe', time: '2:00 PM', type: 'Video Call', condition: 'Follow-up' },
    { name: 'Jane Smith', time: '3:30 PM', type: 'In-Person', condition: 'New Patient' },
    { name: 'Robert Brown', time: '4:15 PM', type: 'Video Call', condition: 'Consultation' }
  ];

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
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Doctor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              {/* Mobile menu button */}
              <button 
                className="lg:hidden text-gray-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <span className="text-2xl">✕</span>
                ) : (
                  <span className="text-2xl">☰</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Hidden on mobile, shown on larger screens */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'patients', label: 'My Patients', icon: <Users className="w-4 h-4" /> },
                  { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
                  { id: 'consultations', label: 'Consultations', icon: <Video className="w-4 h-4" /> },
                  { id: 'prescriptions', label: 'Prescriptions', icon: <Pill className="w-4 h-4" /> },
                  { id: 'ai-assist', label: 'AI Assistant', icon: <Brain className="w-4 h-4" /> }
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

          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute right-0 top-0 h-full w-3/4 bg-white shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
                <nav className="space-y-4 mt-8">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
                    { id: 'patients', label: 'My Patients', icon: <Users className="w-5 h-5" /> },
                    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-5 h-5" /> },
                    { id: 'consultations', label: 'Consultations', icon: <Video className="w-5 h-5" /> },
                    { id: 'prescriptions', label: 'Prescriptions', icon: <Pill className="w-5 h-5" /> },
                    { id: 'ai-assist', label: 'AI Assistant', icon: <Brain className="w-5 h-5" /> }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                        activeTab === item.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome, Dr. Sarah Johnson</h2>
                  
                  {/* Today's Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {todayStats.map((stat, index) => (
                      <div 
                        key={index} 
                        className="bg-white p-4 md:p-6 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                          </div>
                          <div className={`p-2 rounded-full ${stat.color}`}>
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Today's Schedule */}
                  <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
                    <div className="space-y-4">
                      {upcomingPatients.map((patient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{patient.name}</p>
                            <p className="text-sm text-gray-600">{patient.condition}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">{patient.time}</p>
                            <p className="text-xs text-gray-500">{patient.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs */}
            {activeTab !== 'dashboard' && (
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

export default DoctorPortal;