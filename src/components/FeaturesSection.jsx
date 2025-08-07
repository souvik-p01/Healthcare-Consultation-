
import React, { useState } from 'react';
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

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Health Assistant",
      description: "Get instant health advice and symptom analysis powered by advanced AI technology."
    },
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: "Expert Consultations",
      description: "Connect with certified doctors through video calls, chat, or in-person appointments."
    },
    {
      icon: <Ambulance className="w-8 h-8" />,
      title: "Emergency Services",
      description: "24/7 emergency response with real-time ambulance tracking and hospital coordination."
    },
    {
      icon: <Pill className="w-8 h-8" />,
      title: "Pharmacy Network",
      description: "Find nearby pharmacies, compare prices, and get medicines delivered to your door."
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Health Monitoring",
      description: "Track your vitals, medications, and health progress with smart reminders."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Records",
      description: "Your medical data is encrypted and securely stored with easy access when needed."
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Comprehensive Healthcare Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From AI-powered diagnostics to emergency services, we provide everything you need for complete healthcare management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;