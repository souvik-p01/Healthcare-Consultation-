import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Users, Activity, DollarSign, Calendar, AlertCircle, CheckCircle, 
  XCircle, Clock, Menu, X, LogOut, Home, UserCheck, Settings, 
  FileText, TrendingUp, Server, Shield, Bell, Download, Filter,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Search, RefreshCw, Eye, Edit, Trash2, MoreVertical,
  MessageSquare, Send, Star, TrendingDown, Award, Cpu,
  Database, HardDrive, Network, ShieldCheck, Zap,
  UserPlus, UserMinus, Lock, Unlock, Mail
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Custom Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorAlert = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
      <span className="text-red-800 font-medium">Error: {message}</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, change, subtitle, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {change && (
          <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            <span>{Math.abs(change)}% from last period</span>
          </div>
        )}
      </div>
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:scale-105"
  >
    <div className={`${color} p-3 rounded-full mb-2`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </button>
);

const AdminDashboard = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [userInfo, setUserInfo] = useState(null);
  
  // UI State
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Login State
  const [loginData, setLoginData] = useState({
    email: 'patrasouvik313@gmail.com',
    password: 'souvik@123456'
  });

  // Data State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [analytics, setAnalytics] = useState({
    users: [],
    revenue: [],
    providers: []
  });
  const [systemMetrics, setSystemMetrics] = useState(null);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(10);
  
  const [userFilters, setUserFilters] = useState({
    role: '',
    isActive: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBulkNotificationModal, setShowBulkNotificationModal] = useState(false);
  const [bulkNotificationData, setBulkNotificationData] = useState({
    title: '',
    message: '',
    type: 'admin'
  });

  // Bulk Operations
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkOperation, setBulkOperation] = useState('');

  // Chart Periods
  const [chartPeriod, setChartPeriod] = useState('30d');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  // API Helper
  const apiCall = async (endpoint, options = {}) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: defaultHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `API request failed: ${response.status}`);
      }
      
      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiCall('/users/login', {
        method: 'POST',
        body: loginData
      });

      if (data.data.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      setToken(data.data.accessToken);
      setUserInfo(data.data.user);
      setIsAuthenticated(true);
      localStorage.setItem('adminToken', data.data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
      
      showNotification('Login successful!', 'success');
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUserInfo(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLoginData({ email: '', password: '' });
    showNotification('Logged out successfully', 'info');
  };

  // Show Notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch All Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, userAnalytics, revenueAnalytics, metrics] = await Promise.all([
        apiCall('/admin/dashboard'),
        apiCall('/admin/analytics/users?period=30d'),
        apiCall('/admin/analytics/revenue?period=month'),
        apiCall('/admin/metrics')
      ]);
      
      setDashboardStats(stats.data.stats);
      setAnalytics(prev => ({
        ...prev,
        users: userAnalytics.data.analytics || [],
        revenue: revenueAnalytics.data.revenue || []
      }));
      setSystemMetrics(metrics.data.metrics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: usersPerPage,
        ...Object.fromEntries(
          Object.entries(userFilters).filter(([_, value]) => value !== '')
        )
      });

      const data = await apiCall(`/admin/users?${queryParams}`);
      setUsers(data.data.users || []);
      setTotalPages(data.data.totalPages || 1);
      setTotalUsers(data.data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await apiCall('/admin/audit-logs?limit=20&sortOrder=desc');
      setAuditLogs(data.data.auditLogs || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const data = await apiCall('/admin/system-health');
      setSystemHealth(data.data.health);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProviderAnalytics = async () => {
    try {
      const data = await apiCall('/admin/analytics/providers');
      setAnalytics(prev => ({
        ...prev,
        providers: data.data.providers || []
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  // User Management Functions
  const updateUserStatus = async (userId, status, reason = 'Admin action') => {
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: { status, reason }
      });
      
      showNotification(`User ${status} successfully`, 'success');
      fetchUsers();
    } catch (err) {
      showNotification(`Failed to update user: ${err.message}`, 'error');
    }
  };

  const deleteUser = async (userId, permanent = false) => {
    if (!window.confirm(`Are you sure you want to ${permanent ? 'permanently delete' : 'deactivate'} this user?`)) {
      return;
    }

    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'DELETE',
        body: { 
          reason: 'Admin action',
          permanent 
        }
      });
      
      showNotification(`User ${permanent ? 'permanently deleted' : 'deactivated'}`, 'success');
      fetchUsers();
    } catch (err) {
      showNotification(`Failed to delete user: ${err.message}`, 'error');
    }
  };

  const handleBulkOperation = async () => {
    if (selectedUsers.length === 0) {
      showNotification('Please select users first', 'warning');
      return;
    }

    if (!bulkOperation) {
      showNotification('Please select an operation', 'warning');
      return;
    }

    try {
      await apiCall('/admin/bulk-operations', {
        method: 'POST',
        body: {
          operation: bulkOperation,
          userIds: selectedUsers,
          data: bulkOperation === 'assign_role' ? { role: 'patient' } : {}
        }
      });
      
      showNotification(`Bulk operation completed for ${selectedUsers.length} users`, 'success');
      setSelectedUsers([]);
      setBulkOperation('');
      fetchUsers();
    } catch (err) {
      showNotification(`Bulk operation failed: ${err.message}`, 'error');
    }
  };

  const sendBulkNotification = async () => {
    if (selectedUsers.length === 0) {
      showNotification('Please select users first', 'warning');
      return;
    }

    try {
      await apiCall('/admin/notifications/bulk', {
        method: 'POST',
        body: {
          userIds: selectedUsers,
          ...bulkNotificationData
        }
      });
      
      showNotification(`Notification sent to ${selectedUsers.length} users`, 'success');
      setShowBulkNotificationModal(false);
      setBulkNotificationData({ title: '', message: '', type: 'admin' });
    } catch (err) {
      showNotification(`Failed to send notifications: ${err.message}`, 'error');
    }
  };

  // View User Details
  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Initialize
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUserInfo(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data based on view
  useEffect(() => {
    if (isAuthenticated) {
      switch (currentView) {
        case 'dashboard':
          fetchDashboardData();
          break;
        case 'users':
          fetchUsers();
          break;
        case 'audit':
          fetchAuditLogs();
          break;
        case 'health':
          fetchSystemHealth();
          break;
        case 'analytics':
          fetchProviderAnalytics();
          break;
      }
    }
  }, [isAuthenticated, currentView, currentPage, userFilters]);

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'bg-blue-500' },
    { id: 'users', label: 'User Management', icon: Users, color: 'bg-green-500' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'bg-purple-500' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, color: 'bg-yellow-500' },
    { id: 'health', label: 'System Health', icon: Server, color: 'bg-red-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-pink-500' },
  ];

  // Quick Actions
  const quickActions = [
    { icon: UserPlus, label: 'Add User', color: 'bg-blue-500', action: () => {} },
    { icon: Bell, label: 'Send Notification', color: 'bg-green-500', action: () => setShowBulkNotificationModal(true) },
    { icon: Download, label: 'Export Data', color: 'bg-purple-500', action: () => {} },
    { icon: RefreshCw, label: 'Refresh Data', color: 'bg-yellow-500', action: fetchDashboardData },
    { icon: Shield, label: 'Security', color: 'bg-red-500', action: () => setCurrentView('audit') },
    { icon: Settings, label: 'Settings', color: 'bg-gray-500', action: () => {} },
  ];

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
            <p className="text-white/80 mt-2">Healthcare Management System</p>
          </div>

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@healthcare.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-white/60">
            <p className="mb-2">Demo Credentials (Auto-filled)</p>
            <div className="bg-white/10 rounded-lg p-3 font-mono text-xs">
              <p>Email: patrasouvik313@gmail.com</p>
              <p>Password: souvik@123456</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 max-w-md transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : notification.type === 'error' ? (
              <XCircle className="h-5 w-5 mr-2" />
            ) : (
              <Bell className="h-5 w-5 mr-2" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-900 to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="ml-3 text-xl font-bold text-white">HealthCare Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="px-4 py-6">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4 px-3 py-2 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {userInfo?.name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{userInfo?.name || 'Admin'}</p>
                <p className="text-gray-400 text-sm">{userInfo?.email || 'admin@healthcare.com'}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 mr-3"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {navItems.find(item => item.id === currentView)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{userInfo?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {userInfo?.name?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

          {currentView === 'dashboard' && (
            <DashboardView 
              dashboardStats={dashboardStats}
              analytics={analytics}
              systemMetrics={systemMetrics}
              loading={loading}
              quickActions={quickActions}
            />
          )}

          {currentView === 'users' && (
            <UsersView
              users={users}
              loading={loading}
              userFilters={userFilters}
              setUserFilters={setUserFilters}
              currentPage={currentPage}
              totalPages={totalPages}
              totalUsers={totalUsers}
              usersPerPage={usersPerPage} 
              selectedUsers={selectedUsers}
              setSelectedUsers={setSelectedUsers}
              bulkOperation={bulkOperation}
              setBulkOperation={setBulkOperation}
              setCurrentPage={setCurrentPage}
              updateUserStatus={updateUserStatus}
              deleteUser={deleteUser}
              handleBulkOperation={handleBulkOperation}
              viewUserDetails={viewUserDetails}
              fetchUsers={fetchUsers}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
              loading={loading}
              chartPeriod={chartPeriod}
              setChartPeriod={setChartPeriod}
            />
          )}

          {currentView === 'audit' && (
            <AuditLogsView
              auditLogs={auditLogs}
              loading={loading}
            />
          )}

          {currentView === 'health' && (
            <SystemHealthView
              systemHealth={systemHealth}
              systemMetrics={systemMetrics}
              loading={loading}
            />
          )}

          {currentView === 'notifications' && (
            <NotificationsView />
          )}
        </main>
      </div>

      {/* Modals */}
      {showUserModal && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showBulkNotificationModal && (
        <BulkNotificationModal
          data={bulkNotificationData}
          setData={setBulkNotificationData}
          onSubmit={sendBulkNotification}
          onClose={() => setShowBulkNotificationModal(false)}
        />
      )}
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ dashboardStats, analytics, systemMetrics, loading, quickActions }) => {
  if (loading && !dashboardStats) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: dashboardStats?.users?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      subtitle: `${dashboardStats?.users?.active || 0} active`,
      change: 12.5
    },
    {
      title: 'Total Revenue',
      value: `$${(dashboardStats?.financial?.totalRevenue / 100 || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      subtitle: `$${(dashboardStats?.financial?.monthlyRevenue / 100 || 0).toFixed(2)} this month`,
      change: dashboardStats?.financial?.growthRate || 0
    },
    {
      title: 'Appointments',
      value: dashboardStats?.appointments?.total || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      subtitle: `${dashboardStats?.appointments?.thisMonth || 0} this month`,
      change: 8.2
    },
    {
      title: 'System Uptime',
      value: dashboardStats?.system ? `${Math.floor(dashboardStats.system.uptime / 3600)}h` : '0h',
      icon: Server,
      color: 'bg-yellow-500',
      subtitle: '99.9% availability',
      change: 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action, index) => (
          <QuickAction key={index} {...action} />
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Last 30 days</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.users.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).getDate().toString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [value, 'Users']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Monthly</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenue.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="_id" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.split('-')[1]}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [`$${(value / 100).toFixed(2)}`, 'Revenue']}
              />
              <Bar 
                dataKey="total" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Info & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Metrics */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Cpu className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">24%</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Database className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Database</p>
              <p className="text-2xl font-bold text-gray-900">OK</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <HardDrive className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Storage</p>
              <p className="text-2xl font-bold text-gray-900">78%</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Network className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Network</p>
              <p className="text-2xl font-bold text-gray-900">125ms</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Sessions</span>
              <span className="font-semibold text-gray-900">{dashboardStats?.system?.activeSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Critical Alerts</span>
              <span className="font-semibold text-red-600">{dashboardStats?.medical?.criticalResults || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Approvals</span>
              <span className="font-semibold text-yellow-600">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-semibold text-gray-900">45ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users View Component
const UsersView = ({
  users,
  loading,
  userFilters,
  setUserFilters,
  currentPage,
  totalPages,
  totalUsers,
  usersPerPage,
  selectedUsers,
  setSelectedUsers,
  bulkOperation,
  setBulkOperation,
  setCurrentPage,
  updateUserStatus,
  deleteUser,
  handleBulkOperation,
  viewUserDetails,
  fetchUsers
}) => (
  <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600">Manage users, roles, and permissions</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => fetchUsers()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
        <button
          onClick={() => {
            setUserFilters({
              role: '',
              isActive: '',
              search: '',
              dateFrom: '',
              dateTo: ''
            });
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </button>
      </div>
    </div>

    {/* Filters */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Search by name, email..."
          value={userFilters.search}
          onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={userFilters.role}
          onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="patient">Patient</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
        <select
          value={userFilters.isActive}
          onChange={(e) => setUserFilters({ ...userFilters, isActive: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <input
          type="date"
          value={userFilters.dateFrom}
          onChange={(e) => setUserFilters({ ...userFilters, dateFrom: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="From Date"
        />
        <input
          type="date"
          value={userFilters.dateTo}
          onChange={(e) => setUserFilters({ ...userFilters, dateTo: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="To Date"
        />
      </div>
    </div>

    {/* Bulk Operations Bar */}
    {selectedUsers.length > 0 && (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-blue-800">
            <Users className="inline h-4 w-4 mr-1" />
            {selectedUsers.length} user(s) selected
          </span>
          <select
            value={bulkOperation}
            onChange={(e) => setBulkOperation(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Operation</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="suspend">Suspend</option>
            <option value="send_notification">Send Notification</option>
            <option value="assign_role">Change Role</option>
          </select>
          <button
            onClick={handleBulkOperation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Execute
          </button>
          <button
            onClick={() => setSelectedUsers([])}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
    )}

    {/* Users Table */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(u => u._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  checked={selectedUsers.length === users.length && users.length > 0}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'staff' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role || 'patient'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.isEmailVerified && (
                        <ShieldCheck className="h-4 w-4 ml-2 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateUserStatus(
                          user._id,
                          user.isActive ? 'inactive' : 'active'
                        )}
                        className={`p-1 ${user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user._id, false)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700 mb-2 sm:mb-0">
          Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center"
          >
            Previous
          </button>
          <div className="flex items-center">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 mx-1 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Analytics View Component
const AnalyticsView = ({ analytics, loading, chartPeriod, setChartPeriod }) => (
  <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600">Deep insights into system performance</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <select
          value={chartPeriod}
          onChange={(e) => setChartPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>
    </div>

    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Distribution Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
          <PieChartIcon className="h-5 w-5 text-gray-500" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Patients', value: 65 },
                { name: 'Providers', value: 20 },
                { name: 'Admins', value: 5 },
                { name: 'Staff', value: 10 }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {/* {COLORS.map((color, index) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))} */}
              const COLORS = [
                  '#3b82f6',
                  '#10b981',
                  '#f59e0b',
                  '#ef4444',
                  '#8b5cf6',
                  '#6366f1'
                ];
            </Pie>
            <Tooltip formatter={(value) => [value, 'Users']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <LineChartIcon className="h-5 w-5 text-gray-500" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.revenue.slice(-12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="_id" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${month}/${year.slice(-2)}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [`$${(value / 100).toFixed(2)}`, 'Revenue']}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Provider Performance */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Providers</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Appointments</th>
              <th className="px6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {analytics.providers.slice(0, 5).map((provider, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {provider.name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{provider.specialization || 'General'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{provider.totalAppointments || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(provider.rating || 0) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({provider.rating || 0})</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    provider.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {provider.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Audit Logs View Component
const AuditLogsView = ({ auditLogs, loading }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
      <p className="text-gray-600">System activity and security logs</p>
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Performed By</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Timestamp</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No audit logs found</p>
                </td>
              </tr>
            ) : (
              auditLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                      log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                      log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{log.userId?.name || 'N/A'}</div>
                      <div className="text-gray-500">{log.userId?.email || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{log.performedBy?.name || 'System'}</div>
                      <div className="text-gray-500">{log.performedBy?.email || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// System Health View Component
const SystemHealthView = ({ systemHealth, systemMetrics, loading }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
      <p className="text-gray-600">Monitor system performance and health metrics</p>
    </div>

    {/* Health Status Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Database</h3>
          <Database className={`h-6 w-6 ${
            systemMetrics?.database?.status === 'connected' ? 'text-green-500' : 'text-red-500'
          }`} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span className={`text-sm font-medium ${
              systemMetrics?.database?.status === 'connected' ? 'text-green-600' : 'text-red-600'
            }`}>
              {systemMetrics?.database?.status || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Collections</span>
            <span className="text-sm font-medium text-gray-900">
              {systemMetrics?.database?.collections || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">CPU Usage</h3>
          <Cpu className="h-6 w-6 text-blue-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Current</span>
            <span className="text-sm font-medium text-gray-900">24%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Memory</h3>
          <HardDrive className="h-6 w-6 text-purple-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Usage</span>
            <span className="text-sm font-medium text-gray-900">
              {systemHealth?.system?.memory?.heapUsed || 0} MB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Uptime</h3>
          <Clock className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Current</span>
            <span className="text-sm font-medium text-gray-900">
              {systemHealth?.system?.uptime ? 
                `${Math.floor(systemHealth.system.uptime / 3600)}h ${Math.floor((systemHealth.system.uptime % 3600) / 60)}m` 
                : '0h 0m'}
            </span>
          </div>
          <div className="text-sm text-gray-600">99.9% availability</div>
        </div>
      </div>
    </div>

    {/* System Metrics */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Response Time</span>
            <span className="font-medium text-gray-900">45ms avg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Requests/Minute</span>
            <span className="font-medium text-gray-900">1,240</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Error Rate</span>
            <span className="font-medium text-green-600">0.12%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Active Connections</span>
            <span className="font-medium text-gray-900">156</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
        <div className="space-y-3">
          {[
            { service: 'API Gateway', status: 'operational', icon: Network },
            { service: 'Authentication', status: 'operational', icon: Shield },
            { service: 'Database', status: 'operational', icon: Database },
            { service: 'Email Service', status: 'degraded', icon: Mail },
            { service: 'File Storage', status: 'operational', icon: HardDrive },
            { service: 'Payment Gateway', status: 'operational', icon: DollarSign },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <item.icon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700">{item.service}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'operational' ? 'bg-green-100 text-green-800' :
                item.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Notifications View Component
const NotificationsView = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
      <p className="text-gray-600">Send and manage system notifications</p>
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-600 text-center py-8">
        Notification management coming soon...
      </p>
    </div>
  </div>
);

// User Modal Component
const UserModal = ({ user, onClose }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div className="inline-block align-bottom bg-white rounded-xl shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">User Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{user.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joined</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Verified</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.isEmailVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {user.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
              </div>
            )}

            {user.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{user.address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Handle edit
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit User
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Bulk Notification Modal
const BulkNotificationModal = ({ data, setData, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div className="inline-block align-bottom bg-white rounded-xl shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Send Notification</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={data.message}
                onChange={(e) => setData({ ...data, message: e.target.value })}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={data.type}
                onChange={(e) => setData({ ...data, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="system">System</option>
                <option value="announcement">Announcement</option>
                <option value="alert">Alert</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;