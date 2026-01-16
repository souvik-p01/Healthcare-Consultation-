import React, { useState, useEffect, useCallback } from 'react';
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
  TrendingUp,
  Bell,
  Search,
  ChevronRight,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Eye,
  Edit,
  Calendar,
  Zap,
  Battery,
  Thermometer,
  Droplets,
  Activity,
  Menu,
  LogOut,
  Plus,
  Filter,
  RefreshCw,
  AlertTriangle,
  DownloadCloud,
  UploadCloud,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import AiAssistance from './AIAssistantPage';

const TechnicianPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Equipment Maintenance Due', desc: 'Microscope calibration needed', time: '10 min ago', read: false },
    { id: 2, title: 'Test Results Ready', desc: 'Blood test results available for review', time: '1 hour ago', read: false },
    { id: 3, title: 'Quality Alert', desc: 'pH levels outside normal range', time: '2 hours ago', read: true }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  const [technician] = useState({
    name: 'Alex Kumar',
    role: 'Senior Lab Technician',
    experience: '8 years',
    department: 'Pathology & Diagnostics',
    employeeId: 'TECH7890',
    email: 'alex.kumar@healthcare.com',
    phone: '+91 98765 43211',
    qualifications: ['B.Sc Medical Lab Technology', 'M.Sc Pathology', 'Certified Lab Technician'],
    shift: 'Morning (8 AM - 4 PM)',
    nextBreak: '12:00 PM'
  });

  const todayStats = [
    { 
      label: 'Tests Today', 
      value: '24', 
      icon: TestTube, 
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+6 from yesterday',
      trend: 'up'
    },
    { 
      label: 'Reports Ready', 
      value: '18', 
      icon: FileText, 
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+3 from yesterday',
      trend: 'up'
    },
    { 
      label: 'Equipment Active', 
      value: '12', 
      icon: Microscope, 
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '-2 from yesterday',
      trend: 'down'
    },
    { 
      label: 'Quality Score', 
      value: '98%', 
      icon: TrendingUp, 
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      change: '+1% from yesterday',
      trend: 'up'
    }
  ];

  const pendingTests = [
    { 
      id: 1,
      patient: 'John Doe', 
      test: 'Complete Blood Count', 
      priority: 'High',
      status: 'Processing',
      time: '1 hour ago',
      labCode: 'LAB-001',
      specimen: 'Blood',
      dueTime: '30 mins',
      avatar: 'JD',
      age: 45,
      doctor: 'Dr. Sarah Johnson'
    },
    { 
      id: 2,
      patient: 'Jane Smith', 
      test: 'Chest X-Ray', 
      priority: 'Normal',
      status: 'Waiting',
      time: '2 hours ago',
      labCode: 'LAB-002',
      specimen: 'X-Ray',
      dueTime: '2 hours',
      avatar: 'JS',
      age: 32,
      doctor: 'Dr. Michael Chen'
    },
    { 
      id: 3,
      patient: 'Robert Johnson', 
      test: 'MRI Brain Scan', 
      priority: 'High',
      status: 'Scheduled',
      time: '30 mins ago',
      labCode: 'LAB-003',
      specimen: 'MRI',
      dueTime: '1 hour',
      avatar: 'RJ',
      age: 58,
      doctor: 'Dr. Emily Watson'
    },
    { 
      id: 4,
      patient: 'Lisa Taylor', 
      test: 'Urine Analysis', 
      priority: 'Normal',
      status: 'Processing',
      time: '45 mins ago',
      labCode: 'LAB-004',
      specimen: 'Urine',
      dueTime: '1.5 hours',
      avatar: 'LT',
      age: 42,
      doctor: 'Dr. Robert Kim'
    }
  ];

  const activeEquipment = [
    { id: 1, name: 'Centrifuge 5000', status: 'Running', temp: '25°C', usage: '85%', lastMaintenance: '2 days ago' },
    { id: 2, name: 'Microscope DX100', status: 'Idle', temp: '22°C', usage: '45%', lastMaintenance: '1 week ago' },
    { id: 3, name: 'Blood Analyzer Pro', status: 'Running', temp: '28°C', usage: '92%', lastMaintenance: '3 days ago' },
    { id: 4, name: 'PCR Machine', status: 'Maintenance', temp: '--', usage: '0%', lastMaintenance: 'Today' }
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tests', label: 'Lab Tests', icon: TestTube },
    { id: 'equipment', label: 'Equipment', icon: Microscope },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'quality', label: 'Quality Control', icon: Shield },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
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

  const handleStartTest = useCallback((testId) => {
    const test = pendingTests.find(t => t.id === testId);
    if (test) {
      setSelectedTest(test);
      alert(`Starting test: ${test.test}\nPatient: ${test.patient}\nLab Code: ${test.labCode}`);
    }
  }, []);

  const handleCompleteTest = useCallback((testId) => {
    const test = pendingTests.find(t => t.id === testId);
    if (test) {
      alert(`Test completed: ${test.test}\nResults sent to ${test.doctor}`);
    }
  }, []);

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 md:p-6 text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Welcome back, {technician.name}!</h1>
            <p className="text-purple-100">Your lab overview and pending tasks</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/20 w-full lg:w-auto">
            <div className="flex items-center justify-around lg:justify-start lg:gap-6">
              <div className="text-center">
                <p className="text-xs md:text-sm text-purple-200 mb-1">Role</p>
                <p className="text-base md:text-lg font-bold">{technician.role}</p>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/30"></div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-purple-200 mb-1">Experience</p>
                <p className="text-base md:text-lg font-bold">{technician.experience}</p>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/30"></div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-purple-200 mb-1">Shift</p>
                <p className="text-base md:text-lg font-bold">{technician.shift.split(' ')[0]}</p>
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
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
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
        {/* Pending Tests */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-5">
              <h3 className="text-base md:text-lg font-bold text-gray-800">Pending Tests</h3>
              <button 
                onClick={() => setActiveTab('tests')}
                className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {pendingTests.map((test) => (
                <div 
                  key={test.id}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {test.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{test.patient}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          test.priority === 'High' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {test.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2">{test.test}</p>
                      <div className="flex flex-col md:flex-row md:items-center md:gap-3 space-y-1 md:space-y-0">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">Due in: {test.dueTime}</span>
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3 flex-shrink-0" /> 
                          <span className="truncate">Dr: {test.doctor.split('Dr. ')[1]}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 ml-2">
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 text-xs font-medium rounded-full ${
                      test.status === 'Processing' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : test.status === 'Waiting'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {test.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleStartTest(test.id)}
                        className="p-1 hover:bg-green-50 rounded text-green-600 transition-colors"
                        title="Start Test"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleCompleteTest(test.id)}
                        className="p-1 hover:bg-purple-50 rounded text-purple-600 transition-colors"
                        title="Complete Test"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('tests')}
              className="w-full mt-4 py-2 md:py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base font-medium"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Add New Test Request
            </button>
          </div>
        </div>

        {/* Active Equipment & Quick Actions */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">Active Equipment</h3>
            <div className="space-y-3">
              {activeEquipment.map((equipment) => (
                <div key={equipment.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-800 text-sm">{equipment.name}</p>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                      equipment.status === 'Running' ? 'bg-green-100 text-green-700' :
                      equipment.status === 'Idle' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {equipment.status === 'Running' ? <Activity className="w-3 h-3" /> : 
                       equipment.status === 'Idle' ? <PauseCircle className="w-3 h-3" /> :
                       <AlertTriangle className="w-3 h-3" />}
                      {equipment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Temp: {equipment.temp}
                    </div>
                    <div className="flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      Usage: {equipment.usage}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Last maintenance: {equipment.lastMaintenance}
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('equipment')}
              className="w-full mt-3 text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center justify-center gap-1"
            >
              Manage Equipment <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 md:p-6 text-white">
            <h3 className="text-base md:text-lg font-bold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('reports')}
                className="w-full bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
              <button 
                onClick={() => setActiveTab('quality')}
                className="w-full bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Quality Check
              </button>
              <button 
                onClick={() => setActiveTab('ai-analysis')}
                className="w-full bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm text-left transition-colors flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                AI Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LabTestsContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Lab Tests</h2>
            <p className="text-gray-600 text-sm md:text-base">Manage and process laboratory tests</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tests..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              New Test
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Lab Code</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Test Type</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{test.labCode}</div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {test.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{test.patient}</div>
                            <div className="text-xs text-gray-500">{test.age}y • {test.specimen}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{test.test}</div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.priority === 'High' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {test.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.status === 'Processing' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : test.status === 'Waiting'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 md:gap-2">
                          <button 
                            onClick={() => handleStartTest(test.id)}
                            className="p-1 md:p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                            title="Start Test"
                          >
                            <PlayCircle className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => handleCompleteTest(test.id)}
                            className="p-1 md:p-1.5 hover:bg-purple-50 rounded text-purple-600 transition-colors"
                            title="Complete"
                          >
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={() => alert(`Viewing details for ${test.labCode}`)}
                            className="p-1 md:p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                          >
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
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

  const EquipmentContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Equipment Management</h2>
            <p className="text-gray-600 text-sm md:text-base">Monitor and maintain lab equipment</p>
          </div>
          <button className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Add Equipment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeEquipment.map((equipment) => (
            <div key={equipment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{equipment.name}</h3>
                  <p className="text-gray-600 text-sm">Lab Equipment</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  equipment.status === 'Running' ? 'bg-green-100 text-green-700' :
                  equipment.status === 'Idle' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {equipment.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Temperature</span>
                  <span className="font-medium text-gray-800">{equipment.temp}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Usage</span>
                  <span className="font-medium text-gray-800">{equipment.usage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Maintenance</span>
                  <span className="font-medium text-gray-800">{equipment.lastMaintenance}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => alert(`Starting ${equipment.name}`)}
                  className="flex-1 bg-white text-purple-600 border border-purple-600 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  {equipment.status === 'Running' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  {equipment.status === 'Running' ? 'Stop' : 'Start'}
                </button>
                <button 
                  onClick={() => alert(`Scheduling maintenance for ${equipment.name}`)}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Wrench className="w-4 h-4" />
                  Maintain
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
            {/* Technician Information */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                Technician Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={technician.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={technician.role}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={technician.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    defaultValue={technician.phone}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                <textarea 
                  className="w-full p-2.5 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  rows="3"
                  defaultValue={technician.qualifications.join('\n')}
                />
              </div>
              <button 
                onClick={() => alert('Technician information updated successfully!')}
                className="mt-4 md:mt-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow hover:shadow-md font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Lab Settings */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4">Lab Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift Schedule</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    defaultValue={technician.shift}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Next Break</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    defaultValue={technician.nextBreak}
                  />
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 md:p-6 border border-red-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                Emergency Protocols
              </h3>
              <button 
                onClick={() => alert('Activating emergency shutdown...')}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 md:py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow hover:shadow-md font-medium flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                Emergency Shutdown
              </button>
              <p className="text-xs text-gray-600 mt-2 md:mt-3">
                This will immediately stop all equipment and notify supervisors.
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
          <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white shadow">
            {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">Manage your {activeTab.replace('-', ' ')} here</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-purple-50 border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-sm">
            {Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Feature Coming Soon</h3>
          <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6 max-w-md mx-auto">
            This feature is currently under development and will be available in the next update.
          </p>
          <button 
            onClick={() => alert('You will be notified when this feature is available!')}
            className="px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow hover:shadow-md font-medium"
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
          {/* Technician Info */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {technician.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm md:text-base truncate">{technician.name}</p>
                <p className="text-gray-600 text-xs">{technician.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Employee ID</span>
              <span className="font-bold text-purple-600">{technician.employeeId}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-gray-600">Department</span>
              <span className="font-bold text-blue-600">{technician.department.split(' & ')[0]}</span>
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
                      ? 'bg-purple-50 text-purple-600 font-semibold border border-purple-100 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-md ${activeTab === item.id ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
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
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Microscope className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h1 className="font-bold text-base md:text-lg text-gray-800 hidden sm:block">Technician Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search - keep existing */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tests, equipment..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-48 md:w-56 text-sm"
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
                          className="text-xs text-purple-600 hover:text-purple-800"
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
                              !notif.read ? 'bg-purple-50' : ''
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
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full mt-1"></div>
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
              
              {/* Technician Profile */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="text-right hidden md:block">
                  <p className="font-medium text-gray-800 text-sm">{technician.name}</p>
                  <p className="text-xs text-gray-500">ID: {technician.employeeId}</p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {technician.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 pb-16 md:pb-6">
          <div className="max-w-7xl mx-auto py-4 md:py-6">
            {/* Your tab content components */}
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'tests' && <LabTestsContent />}
            {activeTab === 'equipment' && <EquipmentContent />}
            {activeTab === 'ai-analysis' && <AiAssistance role="technician" />}
            {activeTab === 'settings' && <SettingsContent />}
            {activeTab !== 'dashboard' && 
             activeTab !== 'tests' && 
             activeTab !== 'equipment' && 
             activeTab !== 'ai-analysis' &&
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
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-md ${activeTab === item.id ? 'bg-purple-100' : ''}`}>
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

export default TechnicianPortal;