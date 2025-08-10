
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


// Stats Section Component
const StatsSection = () => {
  const stats = [
    { number: "150+", label: "Expert Doctors", icon: <Stethoscope className="w-6 h-6" /> },
    { number: "50K+", label: "Happy Patients", icon: <Users className="w-6 h-6" /> },
    { number: "24/7", label: "Emergency Support", icon: <Ambulance className="w-6 h-6" /> },
    { number: "500+", label: "Partner Pharmacies", icon: <Pill className="w-6 h-6" /> }
  ];

  return (
    <section className="py-20 w-full bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Healthcare Excellence in Numbers</h2>
          <p className="text-xl text-blue-100">Trusted by thousands, delivering quality care across the region</p>
        </div>

        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-white bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold mb-2">{stat.number}</div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default StatsSection;