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
  X
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const LoginSignUpPage = () => {
  // State management
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode = location.state?.mode === 'signup' ? true : false;
  const [isSignUp, setIsSignUp] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

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
    setName('');
    setEmail('');
    setPassword('');
    setUserCaptchaInput('');
    generateCaptcha();
  };

  // Main form submission handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Validate captcha first
    if (userCaptchaInput !== captchaText) {
      alert('❌ Captcha does not match. Please try again.');
      triggerShake();
      generateCaptcha();
      setUserCaptchaInput('');
      return;
    }

    // Validate password for signup
    if (isSignUp && !validatePassword(password)) {
      alert('❌ Password must be 8+ characters long, contain an uppercase letter and a special character (@, $, !, etc.).');
      triggerShake();
      return;
    }

    // Validate required fields
    if (isSignUp && !name.trim()) {
      alert('❌ Please enter your full name.');
      triggerShake();
      return;
    }

    if (!email.trim() || !password.trim()) {
      alert('❌ Please fill in all required fields.');
      triggerShake();
      return;
    }

    try {
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
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      alert('❌ Network error. Please check your connection.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      alert('❌ Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('📧 Password reset request for:', forgotEmail.trim());
      alert('✅ Password reset link sent to your email!');
      setForgotEmail('');
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Forgot password error:', error);
      alert('❌ Error sending reset link. Please try again.');
    } finally {
      setLoading(false);
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
            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="relative"
              >
                <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                  required
                />
              </motion.div>
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
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
                required
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="relative"
            >
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              onClick={onSubmitHandler}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Processing...
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