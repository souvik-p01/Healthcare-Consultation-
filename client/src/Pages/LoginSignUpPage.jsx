import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Lock, 
  Mail, 
  RefreshCcw, 
  User2, 
  Eye,
  EyeOff,
  Heart,
  ArrowLeft,
  X,
  Phone
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

const LoginSignUpPage = () => {
  // Context and navigation
  const { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    loading, 
    user 
  } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const initialMode = location.state?.mode === 'signup' ? true : false;
  const [isSignUp, setIsSignUp] = useState(initialMode);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    dateOfBirth: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const returnUrl = location.state?.from?.pathname || '/dashboard';
      navigate(returnUrl);
    }
  }, [user, navigate, location.state]);

  // Generate captcha on component mount and mode change
  useEffect(() => {
    generateCaptcha();
  }, [isSignUp, showForgotPassword]);

  // Prevent body scroll when on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const hasLength = password.length >= 8;
    return hasUpperCase && hasSpecialChar && hasLength;
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Shake animation trigger for errors
  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 1000);
  };

  // Generate random captcha string
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(captcha);
    setUserCaptchaInput('');
  };

  // Clear all form fields
  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      dateOfBirth: '',
      gender: ''
    });
    setUserCaptchaInput('');
    generateCaptcha();
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Main form submission handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Validate captcha first
    if (userCaptchaInput !== captchaText) {
      toast.error('Captcha does not match. Please try again.');
      triggerShake();
      generateCaptcha();
      setUserCaptchaInput('');
      return;
    }

    // Validate required fields
    if (isSignUp) {
      const requiredFields = ['firstName', 'lastName', 'email', 'password'];
      const missingFields = requiredFields.filter(field => !formData[field]?.trim());
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
        triggerShake();
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        triggerShake();
        return;
      }

      if (!validatePassword(formData.password)) {
        toast.error('Password must be 8+ characters long, contain an uppercase letter and a special character');
        triggerShake();
        return;
      }
    } else {
      if (!formData.email.trim() || !formData.password.trim()) {
        toast.error('Please fill in all required fields');
        triggerShake();
        return;
      }
    }

    try {
<<<<<<< HEAD
      if (isSignUp) {
        await registerUser({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        });
        
        setIsSignUp(false);
        clearForm();
      } else {
        await loginUser({
          email: formData.email.trim(),
          password: formData.password
        });
        
        clearForm();
        const returnUrl = location.state?.from?.pathname || '/dashboard';
        navigate(returnUrl);
=======
      setLoading(true);
      
      const baseURL = 'http://localhost:8000';
      
      if (isSignUp) {
        const response = await fetch(`${baseURL}/api/v1/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('✅ Account created successfully! Welcome to HealthCarePlus!');
          setIsSignUp(false);
          clearForm();
        } else {
          alert(`❌ ${data.message || 'Registration failed'}`);
          triggerShake();
        }
      } else {
        const response = await fetch(`${baseURL}/api/v1/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('✅ Login successful! Redirecting to dashboard...');
          clearForm();
          navigate('/dashboard');
        } else {
          alert(`❌ ${data.message || 'Login failed'}`);
          triggerShake();
        }
>>>>>>> 67a4874 (corrected)
      }
    } catch (error) {
<<<<<<< HEAD
=======
      console.error('Authentication error:', error);
      alert('❌ Network error. Please check your connection.');
>>>>>>> 67a4874 (corrected)
      triggerShake();
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      await forgotPassword(forgotEmail.trim());
      setForgotEmail('');
      setShowForgotPassword(false);
    } catch (error) {
      // Error is already handled in context
    }
  };

  // Toggle between login and signup modes
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearForm();
  };

  // Forgot Password Component
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  HealthCare<span className="text-blue-600">Plus</span>
                </h1>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-gray-600">Enter your email to receive reset instructions</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                  required
                />
              </div>
              
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail('');
                }}
                className="w-full flex items-center justify-center text-blue-600 py-2 text-center hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Login/Signup Component
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={isSignUp ? 'signup' : 'login'}
          initial={{ opacity: 0, y: isSignUp ? 100 : -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isSignUp ? -100 : 100 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 ${
            shaking ? 'animate-shake' : ''
          }`}
        >
          {/* Close Button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 text-gray-500 hover:bg-red-500 hover:text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                HealthCare<span className="text-blue-600">Plus</span>
              </h1>
            </div>
          </motion.div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp
                ? 'Join us and start your health journey!'
                : 'Sign in to access your account'}
            </p>
          </motion.div>

          {/* Form Fields */}
          <form onSubmit={onSubmitHandler} className="space-y-4">
            {/* Name Fields (Sign Up Only) */}
            {isSignUp && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </motion.div>
                

              </>
            )}

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="relative"
            >
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                required
              />
            </motion.div>

            {/* Password Fields */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="relative"
            >
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </motion.div>
            
            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.55 }}
                className="relative"
              >
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                  required
                />
              </motion.div>
            )}

            {/* Role Selection (Sign Up Only) */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.58 }}
                className="relative"
              >
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors bg-white"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </motion.div>
            )}
            
            {/* Captcha Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-700">
                Enter the code below:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg select-none min-w-[120px] justify-center">
                  <span className="font-mono text-lg tracking-wider font-bold">
                    {captchaText}
                  </span>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="hover:bg-blue-700 p-1 rounded transition-colors"
                    title="Generate new captcha"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter code"
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                  maxLength="6"
                  required
                />
              </div>
            </motion.div>

            {/* Forgot Password Link (Login Only) */}
            {!isSignUp && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="text-right"
              >
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </motion.button>

            {/* Toggle Between Login/SignUp */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="text-center mt-6"
            >
              <p className="text-gray-600">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="text-center mt-6 text-gray-500 text-sm"
          >
            © 2025 HealthCarePlus. All rights reserved.
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoginSignUpPage;