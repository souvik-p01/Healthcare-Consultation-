import React, { useState } from 'react';
import { 
  BarChart3, 
  TestTube, 
  Microscope, 
  FileText, 
  Shield, 
  Wrench, 
  Brain,
  Settings,
  Home,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TechnicianPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const todayStats = [
    { label: 'Tests Today', value: '24', icon: <TestTube className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600' },
    { label: 'Reports Ready', value: '18', icon: <FileText className="w-5 h-5" />, color: 'bg-green-100 text-green-600' },
    { label: 'Equipment Active', value: '12', icon: <Microscope className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Quality Score', value: '98%', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' }
  ];

  const pendingTests = [
    { patient: 'John Doe', test: 'Blood Test', priority: 'High', time: '1 hour ago' },
    { patient: 'Jane Smith', test: 'X-Ray', priority: 'Normal', time: '2 hours ago' },
    { patient: 'Robert Johnson', test: 'MRI Scan', priority: 'High', time: '30 mins ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Hidden on mobile, shown on larger screens */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'tests', label: 'Lab Tests', icon: <TestTube className="w-4 h-4" /> },
                  { id: 'equipment', label: 'Equipment', icon: <Microscope className="w-4 h-4" /> },
                  { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
                  { id: 'quality', label: 'Quality Control', icon: <Shield className="w-4 h-4" /> },
                  { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
                  { id: 'ai-analysis', label: 'AI Analysis', icon: <Brain className="w-4 h-4" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                      activeTab === item.id 
                        ? 'bg-purple-100 text-purple-600 shadow-md' 
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
                    { id: 'tests', label: 'Lab Tests', icon: <TestTube className="w-5 h-5" /> },
                    { id: 'equipment', label: 'Equipment', icon: <Microscope className="w-5 h-5" /> },
                    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
                    { id: 'quality', label: 'Quality Control', icon: <Shield className="w-5 h-5" /> },
                    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-5 h-5" /> },
                    { id: 'ai-analysis', label: 'AI Analysis', icon: <Brain className="w-5 h-5" /> }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                        activeTab === item.id 
                          ? 'bg-purple-100 text-purple-600' 
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
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome, Alex Kumar</h2>
                  
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

                  {/* Pending Tests */}
                  <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Tests</h3>
                    <div className="space-y-4">
                      {pendingTests.map((test, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{test.patient}</p>
                            <p className="text-sm text-gray-600">{test.test}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              test.priority === 'High' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {test.priority}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{test.time}</p>
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

export default TechnicianPortal;