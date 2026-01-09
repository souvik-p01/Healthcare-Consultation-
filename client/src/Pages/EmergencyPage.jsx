import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Ambulance,
  ChevronLeft,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  Shield,
  Users,
  Heart,
  Cross,
  Navigation,
  Bell,
  MessageSquare,
  Download
} from 'lucide-react'

const EmergencyPage = () => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [location, setLocation] = useState('Fetching location...')
  const [eta, setEta] = useState(8)
  const [countdown, setCountdown] = useState(eta * 60)

  useEffect(() => {
    // Simulate location fetch
    setTimeout(() => {
      setLocation('Mumbai Central, 400008')
    }, 2000)

    if (emergencyActive) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 0) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [emergencyActive])

  const hospitals = [
    { name: 'Apollo Hospital', distance: '2.3 km', eta: '8 mins', available: true },
    { name: 'Fortis Hospital', distance: '3.1 km', eta: '10 mins', available: true },
    { name: 'Kokilaben Hospital', distance: '4.5 km', eta: '12 mins', available: true },
    { name: 'Lilavati Hospital', distance: '5.2 km', eta: '15 mins', available: false }
  ]

  const emergencyNumbers = [
    { name: 'National Emergency', number: '112' },
    { name: 'Ambulance', number: '108' },
    { name: 'Police', number: '100' },
    { name: 'Fire', number: '101' }
  ]

  const firstAidTips = [
    'Stay calm and assess the situation',
    'Check if the person is breathing',
    'Call emergency services immediately',
    'Do not move the person unless necessary',
    'Apply pressure to stop bleeding',
    'Perform CPR if trained'
  ]

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link 
          to="/services"
          className="inline-flex items-center text-red-600 hover:text-red-700 mb-6 bg-white px-4 py-2 rounded-full shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        {/* Main Emergency Panel */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8 text-white text-center">
            <Ambulance className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Emergency Services</h1>
            <p className="text-red-100 text-lg">24/7 Rapid Response • GPS Tracking • Hospital Coordination</p>
          </div>

          <div className="p-8">
            {!emergencyActive ? (
              <div>
                {/* Emergency Button */}
                <div className="text-center mb-12">
                  <button
                    onClick={() => setEmergencyActive(true)}
                    className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white px-16 py-8 rounded-full text-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all mb-6 animate-pulse"
                  >
                    <AlertCircle className="w-10 h-10 inline mr-4" />
                    REQUEST EMERGENCY AMBULANCE
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity"></div>
                  </button>
                  <p className="text-gray-600">Click only in case of genuine emergency</p>
                </div>

                {/* Emergency Numbers */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Emergency Contact Numbers
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {emergencyNumbers.map((contact, idx) => (
                      <div
                        key={idx}
                        className="bg-red-50 border border-red-100 rounded-xl p-6 text-center hover:bg-red-100 transition-colors"
                      >
                        <Phone className="w-8 h-8 text-red-600 mx-auto mb-3" />
                        <h4 className="font-bold text-gray-800 mb-1">{contact.name}</h4>
                        <a
                          href={`tel:${contact.number}`}
                          className="text-2xl font-bold text-red-600 hover:text-red-700"
                        >
                          {contact.number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nearby Hospitals */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      Nearby Hospitals
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-2" />
                      {location}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {hospitals.map((hospital, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-xl p-4 ${
                          hospital.available
                            ? 'hover:border-red-300 hover:bg-red-50'
                            : 'opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-gray-800">{hospital.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            hospital.available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {hospital.available ? 'Available' : 'Full Capacity'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center">
                            <Navigation className="w-4 h-4 mr-1" />
                            {hospital.distance}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            ETA: {hospital.eta}
                          </span>
                        </div>
                        {hospital.available && (
                          <button className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                            Contact Hospital
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* First Aid Tips */}
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <Heart className="w-6 h-6 mr-3 text-red-600" />
                    First Aid Tips
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {firstAidTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg"
                      >
                        <div className="bg-red-100 text-red-600 p-1 rounded">
                          <Cross className="w-4 h-4" />
                        </div>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-6 flex items-center gap-2 text-red-600 hover:text-red-700">
                    <Download className="w-5 h-5" />
                    Download First Aid Guide (PDF)
                  </button>
                </div>
              </div>
            ) : (
              /* Active Emergency View */
              <div className="text-center">
                <div className="bg-red-50 border-4 border-red-200 rounded-2xl p-8 mb-8 animate-pulse">
                  <Ambulance className="w-20 h-20 text-red-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Emergency Ambulance Dispatched!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Emergency unit is on the way to your location
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">Estimated Arrival</div>
                      <div className="text-4xl font-bold text-red-600">{formatTime(countdown)}</div>
                      <div className="text-sm text-gray-500">Minutes:Seconds</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">Ambulance Number</div>
                      <div className="text-2xl font-bold text-gray-800">MH-12-AB-1234</div>
                      <div className="text-sm text-gray-500">Live Tracking Active</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-500 mb-1">Assigned Hospital</div>
                      <div className="text-xl font-bold text-gray-800">Apollo Hospital</div>
                      <div className="text-sm text-gray-500">2.3 km away</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <button className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
                        <Bell className="w-5 h-5" />
                        Alert Emergency Contacts
                      </button>
                      <button className="flex items-center gap-2 border border-red-600 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50">
                        <MessageSquare className="w-5 h-5" />
                        Chat with Dispatcher
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setEmergencyActive(false)}
                      className="text-gray-600 hover:text-gray-800 underline"
                    >
                      Cancel Emergency Request
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <AlertCircle className="w-6 h-6 mr-3 text-yellow-600" />
                    While Waiting for Ambulance:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">1</span>
                      <span>Stay with the patient and keep them calm</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">2</span>
                      <span>Keep doors and gates unlocked for easy access</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">3</span>
                      <span>Have someone wait outside to guide the ambulance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">4</span>
                      <span>Prepare medical documents and insurance information</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Clock className="w-8 h-8" />,
              title: '24/7 Availability',
              desc: 'Round-the-clock emergency services with rapid response teams'
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: 'Trained Professionals',
              desc: 'Certified paramedics and emergency medical technicians'
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: 'Family Alerts',
              desc: 'Automatic notifications to emergency contacts'
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow text-center">
              <div className="text-red-600 flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmergencyPage