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

// Hero Section Component
const HeroSection = () => {
  return (
    <section id="home" className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
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
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Get Started
              </button>
              <button className="flex items-center text-white border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
              <img 
                src="https://i.pinimg.com/736x/04/fb/c8/04fbc82b3a01a095448eee941b83ea05.jpg" 
                alt="Healthcare professionals" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;