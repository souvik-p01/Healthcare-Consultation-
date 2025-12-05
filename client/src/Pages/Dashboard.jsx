import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Heart, User, Stethoscope, Settings, Activity } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, loading, checkProfileCompletion } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    
    // Check if profile needs completion
    if (user && !loading) {
      const needsCompletion = checkProfileCompletion(user, userRole);
      if (needsCompletion) {
        navigate('/complete-profile');
      }
    }
  }, [user, userRole, loading, navigate, checkProfileCompletion]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleIcon = () => {
    switch (userRole) {
      case 'doctor':
        return <Stethoscope className="w-8 h-8 text-blue-600" />;
      case 'patient':
        return <User className="w-8 h-8 text-green-600" />;
      case 'admin':
        return <Settings className="w-8 h-8 text-purple-600" />;
      default:
        return <Activity className="w-8 h-8 text-gray-600" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                {getRoleIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.firstName}!
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getRoleColor()}`}>
                    {userRole}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{user.email}</span>
                </div>
              </div>
            </div>
            
            {/* Profile Completion Reminder */}
            {checkProfileCompletion(user, userRole) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">
                      Complete your profile
                    </p>
                    <p className="text-sm text-yellow-700">
                      Add more details to get the most out of your account.
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => navigate('/complete-profile')}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors"
                    >
                      Complete Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {userRole === 'patient' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Book Appointment</h3>
                    <p className="text-sm text-gray-600">Schedule with a doctor</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Medical Records</h3>
                    <p className="text-sm text-gray-600">View your health history</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {userRole === 'doctor' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Patient List</h3>
                    <p className="text-sm text-gray-600">Manage your patients</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Appointments</h3>
                    <p className="text-sm text-gray-600">Today's schedule</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Management</h3>
                    <p className="text-sm text-gray-600">Manage system settings</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-600">Manage users and roles</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Profile Settings</h3>
                <p className="text-sm text-gray-600">Update your information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity to display</p>
            <p className="text-sm">Your recent actions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;