import React, { useState, useEffect, useRef } from 'react'
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
  Download,
  X,
  Map,
  PhoneCall,
  MessageCircle
} from 'lucide-react'

const EmergencyPage = () => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [location, setLocation] = useState('Fetching location...')
  const [userCoordinates, setUserCoordinates] = useState(null)
  const [eta, setEta] = useState(15) // Default 15 minutes
  const [countdown, setCountdown] = useState(15 * 60) // 15 minutes in seconds
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [mapHospitals, setMapHospitals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [ambulances, setAmbulances] = useState([])
  const mapContainerRef = useRef(null)

  // Simulated hospital data with coordinates
  const hospitals = [
    { 
      name: 'Apollo Hospital', 
      distance: '2.3 km', 
      eta: '8 mins', 
      available: true,
      coordinates: { lat: 19.0760, lng: 72.8777 },
      phone: '+912266666666',
      beds: 24,
      ambulances: 3
    },
    { 
      name: 'Fortis Hospital', 
      distance: '3.1 km', 
      eta: '10 mins', 
      available: true,
      coordinates: { lat: 19.0860, lng: 72.8877 },
      phone: '+912277777777',
      beds: 18,
      ambulances: 2
    },
    { 
      name: 'Kokilaben Hospital', 
      distance: '4.5 km', 
      eta: '12 mins', 
      available: true,
      coordinates: { lat: 19.0960, lng: 72.8977 },
      phone: '+912288888888',
      beds: 12,
      ambulances: 1
    },
    { 
      name: 'Lilavati Hospital', 
      distance: '5.2 km', 
      eta: '15 mins', 
      available: false,
      coordinates: { lat: 19.1060, lng: 72.9077 },
      phone: '+912299999999',
      beds: 0,
      ambulances: 0
    }
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

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserCoordinates({ lat: latitude, lng: longitude })
          setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`)
          
          // Calculate nearest hospital
          calculateNearestHospital(latitude, longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocation('Location access denied')
          // Default to Mumbai coordinates
          setUserCoordinates({ lat: 19.0760, lng: 72.8777 })
          // Set default selected hospital
          setSelectedHospital(hospitals[0])
        }
      )
    } else {
      // Fallback if geolocation not available
      setUserCoordinates({ lat: 19.0760, lng: 72.8777 })
      setSelectedHospital(hospitals[0])
    }

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

  const calculateNearestHospital = (userLat, userLng) => {
    let nearest = null
    let minDistance = Infinity

    hospitals.forEach(hospital => {
      if (hospital.available) {
        const distance = calculateDistance(
          userLat,
          userLng,
          hospital.coordinates.lat,
          hospital.coordinates.lng
        )
        if (distance < minDistance) {
          minDistance = distance
          nearest = hospital
        }
      }
    })

    if (nearest) {
      // Calculate realistic ETA: 4 minutes per km (average ambulance speed)
      const calculatedEta = Math.min(Math.ceil(minDistance * 4), 30)
      setEta(calculatedEta)
      setCountdown(calculatedEta * 60)
      setSelectedHospital(nearest)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleEmergencyRequest = () => {
    setIsLoading(true)
    
    // Simulate finding available ambulances
    const availableAmbulances = hospitals
      .filter(h => h.available && h.ambulances > 0)
      .flatMap(hospital => {
        // Create ambulance objects for each available ambulance
        const ambulanceList = []
        for (let i = 0; i < hospital.ambulances; i++) {
          ambulanceList.push({
            id: `${hospital.name}-ambulance-${i+1}`,
            number: `AMB-${Math.floor(1000 + Math.random() * 9000)}`,
            hospital: hospital.name,
            distance: hospital.distance,
            eta: hospital.eta,
            phone: hospital.phone,
            coordinates: hospital.coordinates,
            type: i === 0 ? 'Advanced Life Support' : 'Basic Life Support'
          })
        }
        return ambulanceList
      })
      .sort((a, b) => {
        // Sort by distance (parse km from string)
        const distA = parseFloat(a.distance)
        const distB = parseFloat(b.distance)
        return distA - distB
      })

    setAmbulances(availableAmbulances)

    setTimeout(() => {
      setEmergencyActive(true)
      setIsLoading(false)
      
      if (availableAmbulances.length > 0) {
        setMapHospitals(hospitals.filter(h => h.available))
        setShowMap(true)
      }
      
      // Set realistic countdown (15 minutes max)
      const realisticCountdown = 15 * 60 // 15 minutes in seconds
      setCountdown(realisticCountdown)
      setEta(15)
    }, 1500)
  }

  const handleEmergencyCall = (number) => {
    // This will work on mobile devices
    window.location.href = `tel:${number}`
  }

  const handleDownloadPDF = () => {
    // Create and download a simple PDF guide
    const pdfContent = `
      FIRST AID EMERGENCY GUIDE

      1. ASSESS THE SITUATION
      - Check for danger to yourself and others
      - Determine if the person is conscious
      - Check breathing and pulse

      2. CALL FOR HELP
      - Emergency Numbers:
        * National Emergency: 112
        * Ambulance: 108
        * Police: 100
        * Fire: 101

      3. BASIC FIRST AID PROCEDURES

      CPR (Cardiopulmonary Resuscitation):
      - Place heel of hand on center of chest
      - Interlock fingers
      - Press hard and fast (100-120 compressions/min)
      - Give 2 breaths after every 30 compressions

      Bleeding Control:
      - Apply direct pressure with clean cloth
      - Elevate injured area if possible
      - Use pressure points if bleeding doesn't stop

      Choking:
      - Give 5 back blows between shoulder blades
      - Perform abdominal thrusts (Heimlich maneuver)
      - Continue until object is dislodged

      4. EMERGENCY CONTACTS
      Save these numbers in your phone:
      - Family Doctor: __________
      - Emergency Contact: __________
      - Insurance Provider: __________

      This guide is for informational purposes only.
      Always seek professional medical help in emergencies.
    `

    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'First_Aid_Emergency_Guide.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleCallAmbulance = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    // For emergency response, we typically don't need hours (max 30-60 mins)
    // So we show MM:SS format
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const openGoogleMaps = (destination) => {
    if (userCoordinates) {
      const url = `https://www.google.com/maps/dir/${userCoordinates.lat},${userCoordinates.lng}/${destination.lat},${destination.lng}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-4 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-6xl">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <Link 
            to="/services"
            className="inline-flex items-center text-red-600 hover:text-red-700 bg-white px-3 py-2 md:px-4 md:py-2 rounded-full shadow text-sm md:text-base"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Back to Services
          </Link>
        </div>

        {/* Main Emergency Panel */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden mb-6 md:mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-4 md:p-8 text-white text-center">
            <Ambulance className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4" />
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Emergency Services</h1>
            <p className="text-red-100 text-sm md:text-lg">24/7 Rapid Response • GPS Tracking • Hospital Coordination</p>
          </div>

          <div className="p-4 md:p-8">
            {!emergencyActive ? (
              <div>
                {/* Emergency Button */}
                <div className="text-center mb-8 md:mb-12">
                  <button
                    onClick={handleEmergencyRequest}
                    disabled={isLoading}
                    className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-6 md:px-16 md:py-8 rounded-full text-lg md:text-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all mb-4 md:mb-6 animate-pulse w-full max-w-md mx-auto disabled:opacity-70"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 md:h-8 md:w-8 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Locating nearest ambulance...
                      </span>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 md:w-10 md:h-10 inline mr-2 md:mr-4" />
                        REQUEST EMERGENCY AMBULANCE
                      </>
                    )}
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity"></div>
                  </button>
                  <p className="text-gray-600 text-sm md:text-base">Click only in case of genuine emergency</p>
                </div>

                {/* Emergency Numbers */}
                <div className="mb-8 md:mb-12">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 text-center">
                    Emergency Contact Numbers
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {emergencyNumbers.map((contact, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmergencyCall(contact.number)}
                        className="bg-red-50 border border-red-100 rounded-xl p-4 md:p-6 text-center hover:bg-red-100 transition-colors active:scale-95"
                      >
                        <Phone className="w-6 h-6 md:w-8 md:h-8 text-red-600 mx-auto mb-2 md:mb-3" />
                        <h4 className="font-bold text-gray-800 mb-1 text-sm md:text-base">{contact.name}</h4>
                        <div className="text-lg md:text-2xl font-bold text-red-600 hover:text-red-700">
                          {contact.number}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Tap to call</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Display */}
                <div className="mb-6 md:mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Your Location</p>
                        <p className="font-medium text-gray-800">{location}</p>
                      </div>
                    </div>
                    {userCoordinates && (
                      <button 
                        onClick={() => openGoogleMaps(userCoordinates)}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Map className="w-4 h-4 mr-1" />
                        View on Map
                      </button>
                    )}
                  </div>
                </div>

                {/* Nearby Hospitals */}
                <div className="mb-6 md:mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                      Nearby Hospitals
                    </h3>
                    <button 
                      onClick={() => {
                        setMapHospitals(hospitals.filter(h => h.available))
                        setShowMap(true)
                      }}
                      className="flex items-center text-red-600 hover:text-red-700 text-sm md:text-base"
                    >
                      <Map className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      View on Map
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                    {hospitals.map((hospital, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-xl p-3 md:p-4 ${
                          hospital.available
                            ? 'hover:border-red-300 hover:bg-red-50'
                            : 'opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2 md:mb-3">
                          <h4 className="font-bold text-gray-800 text-sm md:text-base">{hospital.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            hospital.available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {hospital.available ? 'Available' : 'Full'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <Navigation className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            {hospital.distance}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            ETA: {hospital.eta}
                          </span>
                          <span className="flex items-center">
                            <Ambulance className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Ambulances: {hospital.ambulances}
                          </span>
                        </div>
                        {hospital.available && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleCallAmbulance(hospital.phone)}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm flex items-center justify-center"
                            >
                              <PhoneCall className="w-4 h-4 mr-1" />
                              Call
                            </button>
                            <button 
                              onClick={() => openGoogleMaps(hospital.coordinates)}
                              className="flex-1 border border-red-600 text-red-600 py-2 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center"
                            >
                              <Navigation className="w-4 h-4 mr-1" />
                              Directions
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* First Aid Tips */}
                <div className="bg-red-50 border border-red-100 rounded-xl md:rounded-2xl p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-red-600" />
                    First Aid Tips
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                    {firstAidTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-white rounded-lg"
                      >
                        <div className="bg-red-100 text-red-600 p-1 rounded flex-shrink-0">
                          <Cross className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                        <span className="text-sm md:text-base">{tip}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleDownloadPDF}
                    className="mt-4 md:mt-6 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm md:text-base"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                    Download First Aid Guide (PDF)
                  </button>
                </div>
              </div>
            ) : (
              /* Active Emergency View */
              <div className="text-center">
                <div className="bg-red-50 border-4 border-red-200 rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 animate-pulse">
                  <Ambulance className="w-16 h-16 md:w-20 md:h-20 text-red-600 mx-auto mb-3 md:mb-4" />
                  <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2">
                    Emergency Ambulance Dispatched!
                  </h2>
                  <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
                    Emergency unit is on the way to your location
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-white p-3 md:p-4 rounded-xl">
                      <div className="text-xs md:text-sm text-gray-500 mb-1">Estimated Arrival</div>
                      <div className="text-2xl md:text-4xl font-bold text-red-600">{formatTime(countdown)}</div>
                      <div className="text-xs md:text-sm text-gray-500">Minutes:Seconds</div>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl">
                      <div className="text-xs md:text-sm text-gray-500 mb-1">Ambulance Number</div>
                      <div className="text-lg md:text-2xl font-bold text-gray-800">
                        {ambulances.length > 0 ? ambulances[0].number : 'AMB-XXXX'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">Live Tracking Active</div>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl">
                      <div className="text-xs md:text-sm text-gray-500 mb-1">Assigned Hospital</div>
                      <div className="text-lg md:text-xl font-bold text-gray-800">
                        {selectedHospital?.name || 'Apollo Hospital'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {selectedHospital?.distance || '2.3 km'} away
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                      <button 
                        onClick={() => handleEmergencyCall('108')}
                        className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-lg hover:bg-red-700 w-full sm:w-auto"
                      >
                        <PhoneCall className="w-4 h-4 md:w-5 md:h-5" />
                        Call Ambulance
                      </button>
                      <button 
                        onClick={() => setShowMap(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                      >
                        <Map className="w-4 h-4 md:w-5 md:h-5" />
                        View Ambulances
                      </button>
                      <button className="flex items-center justify-center gap-2 border border-red-600 text-red-600 px-4 py-3 md:px-6 md:py-3 rounded-lg hover:bg-red-50 w-full sm:w-auto">
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                        Chat with Dispatcher
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setEmergencyActive(false)
                        setCountdown(15 * 60)
                      }}
                      className="text-gray-600 hover:text-gray-800 underline text-sm md:text-base"
                    >
                      Cancel Emergency Request
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left bg-yellow-50 border border-yellow-200 rounded-xl md:rounded-2xl p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-yellow-600" />
                    While Waiting for Ambulance:
                  </h3>
                  <ul className="space-y-2 md:space-y-3">
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm flex-shrink-0">1</span>
                      <span className="text-sm md:text-base">Stay with the patient and keep them calm</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm flex-shrink-0">2</span>
                      <span className="text-sm md:text-base">Keep doors and gates unlocked for easy access</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm flex-shrink-0">3</span>
                      <span className="text-sm md:text-base">Have someone wait outside to guide the ambulance</span>
                    </li>
                    <li className="flex items-start gap-2 md:gap-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm flex-shrink-0">4</span>
                      <span className="text-sm md:text-base">Prepare medical documents and insurance information</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              icon: <Clock className="w-6 h-6 md:w-8 md:h-8" />,
              title: '24/7 Availability',
              desc: 'Round-the-clock emergency services with rapid response teams'
            },
            {
              icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
              title: 'Trained Professionals',
              desc: 'Certified paramedics and emergency medical technicians'
            },
            {
              icon: <Users className="w-6 h-6 md:w-8 md:h-8" />,
              title: 'Family Alerts',
              desc: 'Automatic notifications to emergency contacts'
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-4 md:p-6 rounded-xl shadow text-center">
              <div className="text-red-600 flex justify-center mb-3 md:mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">{feature.title}</h3>
              <p className="text-xs md:text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Map Modal - FIXED with proper scrolling */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                {emergencyActive ? 'Nearest Available Ambulances' : 'Nearby Hospitals'}
              </h3>
              <button 
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4" ref={mapContainerRef}>
              {/* Simulated Map View */}
              <div className="bg-gray-100 rounded-lg h-48 md:h-64 relative mb-4">
                {/* User location marker */}
                {userCoordinates && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="bg-blue-600 text-white p-2 rounded-full animate-pulse">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="text-xs bg-white px-2 py-1 rounded mt-1 shadow">You</div>
                  </div>
                )}
                
                {/* Hospital/Ambulance markers */}
                {(emergencyActive ? mapHospitals : hospitals.filter(h => h.available)).map((item, idx) => (
                  <div
                    key={idx}
                    className={`absolute ${item.available ? 'text-green-600' : 'text-gray-400'}`}
                    style={{
                      top: `${20 + idx * 15}%`,
                      left: `${30 + idx * 10}%`,
                      zIndex: 5
                    }}
                  >
                    <div className="relative">
                      <MapPin className="w-8 h-8" />
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                        <Ambulance className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xs bg-white px-2 py-1 rounded mt-1 whitespace-nowrap shadow">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Ambulances/Hospitals List */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800">
                  {emergencyActive ? 'Available Ambulances:' : 'Hospital Details:'}
                </h4>
                
                {/* Scrollable container */}
                <div className="max-h-64 md:max-h-96 overflow-y-auto pr-2">
                  {emergencyActive ? (
                    // Show ambulances when emergency is active
                    ambulances.length > 0 ? (
                      ambulances.map((ambulance, idx) => (
                        <div key={ambulance.id} className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h5 className="font-bold text-gray-800">{ambulance.hospital} Ambulance</h5>
                              <p className="text-sm text-gray-600">Type: {ambulance.type}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                              Available
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div className="flex items-center">
                              <Ambulance className="w-4 h-4 mr-2 text-gray-500" />
                              {ambulance.number}
                            </div>
                            <div className="flex items-center">
                              <Navigation className="w-4 h-4 mr-2 text-gray-500" />
                              {ambulance.distance}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-500" />
                              ETA: {ambulance.eta}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-500" />
                              Call Driver
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleCallAmbulance(ambulance.phone)}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm flex items-center justify-center"
                            >
                              <PhoneCall className="w-4 h-4 mr-1" />
                              Call Now
                            </button>
                            <button 
                              onClick={() => openGoogleMaps(ambulance.coordinates)}
                              className="flex-1 border border-red-600 text-red-600 py-2 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center"
                            >
                              <Navigation className="w-4 h-4 mr-1" />
                              Track
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Ambulance className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No ambulances available at the moment</p>
                        <p className="text-sm">Please try again in a few minutes</p>
                      </div>
                    )
                  ) : (
                    // Show hospitals when emergency is not active
                    hospitals.filter(h => h.available).map((hospital, idx) => (
                      <div key={idx} className="border rounded-lg p-3 mb-3 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-gray-800">{hospital.name}</h5>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            Available
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center">
                            <Navigation className="w-4 h-4 mr-2 text-gray-500" />
                            {hospital.distance}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            ETA: {hospital.eta}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {hospital.phone}
                          </div>
                          <div className="flex items-center">
                            <Ambulance className="w-4 h-4 mr-2 text-gray-500" />
                            Ambulances: {hospital.ambulances}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleCallAmbulance(hospital.phone)}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm flex items-center justify-center"
                          >
                            <PhoneCall className="w-4 h-4 mr-1" />
                            Call Hospital
                          </button>
                          <button 
                            onClick={() => openGoogleMaps(hospital.coordinates)}
                            className="flex-1 border border-red-600 text-red-600 py-2 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center"
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Get Directions
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => window.open('https://www.google.com/maps', '_blank')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center mx-auto"
                >
                  <Map className="w-5 h-5 mr-2" />
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmergencyPage