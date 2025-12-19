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
import { useAppContext } from '../context/AppContext';

const LoginSignUpPage = () => {
  const {
    registerUser,
    loginUser,
    forgotPassword,
    loading,
    user
  } = useAppContext();

  const location = useLocation();
  const navigate = useNavigate();

  const initialMode = location.state?.mode === 'signup';
  const [isSignUp, setIsSignUp] = useState(initialMode);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  /* ---------------- Redirect if logged in ---------------- */
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  /* ---------------- Captcha ---------------- */
  useEffect(() => {
    generateCaptcha();
  }, [isSignUp, showForgotPassword]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaText(captcha);
    setUserCaptchaInput('');
  };

  /* ---------------- Helpers ---------------- */
  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 800);
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[@$!%*?&]/.test(password)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient'
    });
    generateCaptcha();
  };

  /* ---------------- Submit Handler ---------------- */
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (userCaptchaInput !== captchaText) {
      toast.error('Captcha does not match');
      triggerShake();
      generateCaptcha();
      return;
    }

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        if (!validatePassword(formData.password)) {
          toast.error('Password must be strong (8+, uppercase, special char)');
          return;
        }

        await registerUser({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        });

        toast.success('Account created successfully');
        setIsSignUp(false);
        clearForm();
      } else {
        await loginUser({
          email: formData.email.trim(),
          password: formData.password
        });

        toast.success('Login successful');
        navigate('/dashboard');
      }
    } catch {
      triggerShake();
    }
  };

  /* ---------------- Forgot Password ---------------- */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return toast.error('Enter email');
    await forgotPassword(forgotEmail.trim());
    setForgotEmail('');
    setShowForgotPassword(false);
  };

  /* ---------------- Forgot Password UI ---------------- */
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>

          <input
            type="email"
            placeholder="Enter your email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="w-full border p-3 rounded mb-4"
          />

          <button
            onClick={handleForgotPassword}
            className="w-full bg-blue-600 text-white py-3 rounded"
          >
            Send Reset Link
          </button>

          <button
            onClick={() => setShowForgotPassword(false)}
            className="mt-4 flex items-center justify-center text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Main UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`bg-white p-8 rounded-xl shadow-xl w-full max-w-md ${shaking ? 'animate-shake' : ''}`}
        >
          <div className="text-center mb-6">
            <Heart className="mx-auto text-blue-600 w-10 h-10" />
            <h1 className="text-2xl font-bold mt-2">
              HealthCare<span className="text-blue-600">Plus</span>
            </h1>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="border p-3 rounded"
                  required
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="border p-3 rounded"
                  required
                />
              </div>
            )}

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="border p-3 rounded w-full"
              required
            />

            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="border p-3 rounded w-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {isSignUp && (
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="border p-3 rounded w-full"
                required
              />
            )}

            <div className="flex gap-3 items-center">
              <div className="bg-blue-600 text-white px-4 py-2 rounded font-mono">
                {captchaText}
              </div>
              <input
                placeholder="Captcha"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                className="border p-2 rounded flex-1"
                required
              />
              <RefreshCcw onClick={generateCaptcha} className="cursor-pointer" />
            </div>

            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 text-sm"
              >
                Forgot Password?
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 ml-2"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoginSignUpPage;
