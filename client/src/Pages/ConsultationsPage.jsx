import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  ChevronLeft,
  Search,
  Filter,
  Video,
  Phone,
  MapPin,
  Star,
  Clock,
  Users,
  Calendar,
  MessageSquare,
  CheckCircle
} from 'lucide-react'

const ConsultationsPage = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const specialties = [
    { id: 'all', name: 'All Specialties', count: 24 },
    { id: 'cardiology', name: 'Cardiology', count: 6 },
    { id: 'neurology', name: 'Neurology', count: 4 },
    { id: 'pediatrics', name: 'Pediatrics', count: 5 },
    { id: 'orthopedics', name: 'Orthopedics', count: 4 },
    { id: 'dermatology', name: 'Dermatology', count: 3 },
    { id: 'psychiatry', name: 'Psychiatry', count: 2 }
  ]

  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      rating: 4.9,
      reviews: 245,
      experience: '12 years',
      price: '₹599',
      availableToday: true,
      languages: ['English', 'Hindi'],
      image: '👩‍⚕️',
      availability: ['Mon', 'Wed', 'Fri'],
      videoConsultation: true
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Neurology',
      rating: 4.8,
      reviews: 189,
      experience: '15 years',
      price: '₹699',
      availableToday: false,
      languages: ['English', 'Mandarin'],
      image: '👨‍⚕️',
      availability: ['Tue', 'Thu', 'Sat'],
      videoConsultation: true
    },
    {
      id: 3,
      name: 'Dr. Priya Sharma',
      specialty: 'Pediatrics',
      rating: 5.0,
      reviews: 312,
      experience: '8 years',
      price: '₹499',
      availableToday: true,
      languages: ['Hindi', 'English', 'Marathi'],
      image: '👩‍⚕️',
      availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      videoConsultation: true
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      specialty: 'Orthopedics',
      rating: 4.7,
      reviews: 178,
      experience: '18 years',
      price: '₹649',
      availableToday: true,
      languages: ['English'],
      image: '👨‍⚕️',
      availability: ['Wed', 'Thu', 'Sat'],
      videoConsultation: false
    },
    {
      id: 5,
      name: 'Dr. Anjali Mehta',
      specialty: 'Dermatology',
      rating: 4.9,
      reviews: 267,
      experience: '10 years',
      price: '₹549',
      availableToday: false,
      languages: ['Hindi', 'English', 'Gujarati'],
      image: '👩‍⚕️',
      availability: ['Mon', 'Tue', 'Fri'],
      videoConsultation: true
    },
    {
      id: 6,
      name: 'Dr. Robert Kim',
      specialty: 'Psychiatry',
      rating: 4.6,
      reviews: 156,
      experience: '14 years',
      price: '₹749',
      availableToday: true,
      languages: ['English', 'Korean'],
      image: '👨‍⚕️',
      availability: ['Tue', 'Thu'],
      videoConsultation: true
    }
  ]

  const consultationTypes = [
    { type: 'video', icon: <Video className="w-5 h-5" />, label: 'Video Consultation' },
    { type: 'phone', icon: <Phone className="w-5 h-5" />, label: 'Phone Consultation' },
    { type: 'in-person', icon: <MapPin className="w-5 h-5" />, label: 'In-person Visit' }
  ]

  const filteredDoctors = selectedSpecialty === 'all'
    ? doctors
    : doctors.filter(doctor => doctor.specialty.toLowerCase() === selectedSpecialty)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8">
      <div className="container mx-auto px-4">
        <Link 
          to="/services"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 bg-white px-4 py-2 rounded-full shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-xl text-white">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Expert Consultations</h1>
                <p className="text-gray-600">Book appointments with certified specialists</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Average Response Time</div>
                <div className="text-xl font-bold text-blue-600 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  15 minutes
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search doctors by name, specialty, or symptoms..."
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 bg-white border px-6 py-3 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Consultation Types */}
          <div className="flex flex-wrap gap-3 mb-8">
            {consultationTypes.map((consultation) => (
              <button
                key={consultation.type}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                {consultation.icon}
                {consultation.label}
              </button>
            ))}
          </div>

          {/* Specialties */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Browse by Specialty</h3>
            <div className="flex flex-wrap gap-3">
              {specialties.map((specialty) => (
                <button
                  key={specialty.id}
                  onClick={() => setSelectedSpecialty(specialty.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedSpecialty === specialty.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {specialty.name}
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {specialty.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-5xl">{doctor.image}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{doctor.name}</h3>
                        <p className="text-blue-600 text-sm font-medium">{doctor.specialty}</p>
                      </div>
                      {doctor.videoConsultation && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          <Video className="w-3 h-3" />
                          Video
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 font-medium">{doctor.rating}</span>
                        <span className="ml-1 text-sm text-gray-500">({doctor.reviews} reviews)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {doctor.experience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {doctor.languages.join(', ')}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-xs text-gray-500 mb-1">Available on:</div>
                      <div className="flex gap-1">
                        {doctor.availability.map((day, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-500">Starting from</div>
                    <div className="text-2xl font-bold text-gray-800">{doctor.price}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDoctor(doctor)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Book Now
                    </button>
                    <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Book Appointment</h3>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">{selectedDoctor.image}</div>
                <div>
                  <h4 className="font-bold text-lg">{selectedDoctor.name}</h4>
                  <p className="text-blue-600">{selectedDoctor.specialty}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((time) => (
                      <button
                        key={time}
                        className="px-3 py-2 border rounded-lg hover:bg-blue-50 hover:border-blue-500"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Type
                  </label>
                  <div className="flex gap-3">
                    {consultationTypes.map((type) => (
                      <button
                        key={type.type}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-blue-50"
                      >
                        {type.icon}
                        <span className="text-sm">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Appointment booked successfully!')
                    setSelectedDoctor(null)
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-lg hover:shadow-lg"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Why Choose Us */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Why Choose Our Consultation Service?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: 'Verified Doctors',
                desc: 'All doctors are verified with proper credentials and experience'
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'Quick Appointments',
                desc: 'Get appointments within 24 hours, often same-day availability'
              },
              {
                icon: <Video className="w-6 h-6" />,
                title: 'Multiple Options',
                desc: 'Choose from video, phone, or in-person consultations'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-4">
                <div className="text-blue-600 flex justify-center mb-3">
                  {feature.icon}
                </div>
                <h4 className="font-bold text-gray-800 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultationsPage