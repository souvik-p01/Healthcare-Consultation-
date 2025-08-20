import React, { useState, useEffect, useRef } from 'react';
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

// User Roles Section Component
const UserRolesSection = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  
  const roles = [
    {
      title: "Patient Portal",
      icon: <UserCheck className="w-12 h-12" />,
      features: [
        "AI symptom checker and health advice",
        "Book appointments with specialists",
        "Access medical records and reports",
        "Telemedicine consultations",
        "Pharmacy and medicine ordering",
        "Emergency ambulance booking"
      ],
      color: "bg-green-500",
      path: "/patient-portal",
      delay: 0
    },
    {
      title: "Doctor Portal",
      icon: <Stethoscope className="w-12 h-12" />,
      features: [
        "Manage patient appointments",
        "Conduct video consultations",
        "Access patient medical history",
        "AI-assisted diagnosis tools",
        "Prescription management",
        "Patient communication system"
      ],
      color: "bg-blue-500",
      path: "/doctor-portal",
      delay: 200
    },
    {
      title: "Technician Portal",
      icon: <Settings className="w-12 h-12" />,
      features: [
        "Manage lab test schedules",
        "Upload and analyze reports",
        "Equipment maintenance tracking",
        "Quality control monitoring",
        "Patient sample management",
        "Integration with AI analysis"
      ],
      color: "bg-purple-500",
      path: "/technician-portal",
      delay: 400
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePortalAccess = (path) => {
    // Add smooth scroll animation before navigation
    document.body.style.opacity = '0.95';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      navigate(path);
      document.body.style.opacity = '1';
    }, 300);
  };

  return (
    <section ref={sectionRef} className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 transform transition-all duration-1000 ease-out"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
              }}>
            Choose Your Portal
          </h2>
          <p className="text-xl text-gray-600 transform transition-all duration-1000 ease-out delay-300"
             style={{
               opacity: isVisible ? 1 : 0,
               transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
             }}>
            Tailored experiences for every user type
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-all duration-500 ease-out transform hover:-translate-y-2"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
                transition: `all 0.6s ease-out ${role.delay}ms, transform 0.3s ease, box-shadow 0.3s ease`
              }}
            >
              <div className={`${role.color} text-white w-20 h-20 rounded-lg flex items-center justify-center mb-6 mx-auto transform transition-all duration-500 ease-out hover:scale-110`}>
                {role.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">{role.title}</h3>
              <ul className="space-y-3">
                {role.features.map((feature, fIndex) => (
                  <li 
                    key={fIndex} 
                    className="flex items-start transform transition-all duration-500 ease-out"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                      transitionDelay: isVisible ? `${fIndex * 100 + role.delay}ms` : '0ms'
                    }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePortalAccess(role.path)}
                className={`w-full ${role.color} text-white py-3 rounded-lg font-semibold mt-6 hover:opacity-90 transition-all duration-300 ease-out transform hover:scale-105`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: isVisible ? `${role.delay + 600}ms` : '0ms'
                }}
              >
                Access Portal
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fade-in-left {
          animation: fadeInLeft 0.6s ease-out forwards;
        }
        
        .portal-card {
          opacity: 0;
          transform: translateY(50px) scale(0.95);
        }
        
        .portal-card.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </section>
  );
};
export default UserRolesSection;