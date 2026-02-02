import React, { useContext, useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  Shield, 
  Stethoscope, 
  Activity, 
  Ambulance,
  Pill,
  Brain,
  UserCheck,
  Settings,
  ChevronDown,
  Menu,
  X,
  Play,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

// Hero Section Component
const HeroSection = () => {
  const navigate = useNavigate();
  const { showLogin, userRole } = useContext(AppContext);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);

  const handleClick = () => {
    if (showLogin) {
      if (userRole === 'Patient') navigate('/patient-portal');
      else if (userRole === 'Doctor') navigate('/doctor-portal');
      else if (userRole === 'Technician') navigate('/technician-portal');
      else return null;
    } else navigate('/login');
  };

  const handleWatchDemo = () => {
    setShowVideo(true);
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play();
    }
  }, [showVideo]);

  // Prevent body scroll when video is open
  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVideo]);

  // Add fade-in and scale-in animation styles
  const animationStyles = `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }

    .animate-scaleIn {
      animation: scaleIn 0.4s ease-out;
    }
  `;

  return (
    <>
      <section 
        id="home" 
        className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20"
        data-section="hero"
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Your Path to Wellness with 
                <span className="text-blue-200"> AI-Powered</span> Healthcare
              </h1>
              <p className="text-xl mb-8 text-blue-100 leading-relaxed">
                Experience the future of healthcare with our comprehensive platform featuring AI consultations, 
                telemedicine, emergency services, and personalized care - all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleClick} 
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-300"
                  type="button"
                  aria-label="Get Started"
                >
                  Get Started
                </button>
                <button 
                  onClick={handleWatchDemo}
                  className="flex items-center justify-center text-white border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300"
                  type="button"
                  aria-label="Watch Demo Video"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                <img 
                  src="../../src/assets/CoverPhoto.png" 
                  alt="Healthcare professionals using digital tablets and medical equipment" 
                  className="rounded-lg shadow-2xl w-full h-auto"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/800x500/1e40af/ffffff?text=Healthcare+Professionals';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Popup Modal */}
      {showVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
          onClick={handleCloseVideo}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
        >
          <div 
            className="relative w-full max-w-5xl mx-4"
            style={{ animation: 'scaleIn 0.4s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseVideo}
              className="absolute -top-12 left-0 text-white hover:text-blue-400 transition-colors duration-300 flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg backdrop-blur-sm"
              type="button"
              aria-label="Close video player"
            >
              <X className="w-6 h-6" />
              <span className="font-semibold">Close</span>
            </button>

            {/* Video Container */}
            <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                className="w-full h-auto"
                controls
                autoPlay
                playsInline
                aria-label="Healthcare platform demo video"
                poster="../../src/assets/video-poster.jpg"
              >
                <source src="../../src/assets/video.mp4" type="video/mp4" />
                <source src="../../src/assets/video.webm" type="video/webm" />
                <track
                  kind="captions"
                  src="../../src/assets/video-captions.vtt"
                  srcLang="en"
                  label="English"
                  default
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles to document head */}
      {useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = animationStyles;
        document.head.appendChild(styleElement);
        
        return () => {
          document.head.removeChild(styleElement);
        };
      }, [])}
    </>
  );
};

export default HeroSection;