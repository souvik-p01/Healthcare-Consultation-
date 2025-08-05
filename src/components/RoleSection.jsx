
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

// User Roles Section Component
const UserRolesSection = () => {
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
      color: "bg-green-500"
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
      color: "bg-blue-500"
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
      color: "bg-purple-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Choose Your Portal</h2>
          <p className="text-xl text-gray-600">Tailored experiences for every user type</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className={`${role.color} text-white w-20 h-20 rounded-lg flex items-center justify-center mb-6 mx-auto`}>
                {role.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">{role.title}</h3>
              <ul className="space-y-3">
                {role.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full ${role.color} text-white py-3 rounded-lg font-semibold mt-6 hover:opacity-90 transition-opacity`}>
                Access Portal
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};