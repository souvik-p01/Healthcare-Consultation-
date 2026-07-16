import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Download,
  X,
  Map,
  PhoneCall,
  MessageCircle,
  Loader
} from 'lucide-react'
import { emergencyAPI } from './services/api'

const EmergencyPage = () => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [location, setLocation] = useState('Fetching location...')
  const [userCoordinates, setUserCoordinates] = useState(null)
  const [eta, setEta] = useState(15)
  const [countdown, setCountdown] = useState(15 * 60)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [mapHospitals, setMapHospitals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [ambulances, setAmbulances] = useState([])
  const [availableAmbulances, setAvailableAmbulances] = useState([])
  const [selectedAmbulanceProvider, setSelectedAmbulanceProvider] = useState('')

  // Fetch available ambulances near coordinates
  useEffect(() => {
    if (userCoordinates) {
      const fetchAmbulances = async () => {
        try {
          const res = await emergencyAPI.getNearbyAmbulances({
            lat: userCoordinates.lat,
            lng: userCoordinates.lng
          })
          if (res?.data?.success) {
            setAvailableAmbulances(res.data.data)
            if (res.data.data.length > 0) {
              setSelectedAmbulanceProvider(res.data.data[0].providerName)
            }
          }
        } catch (error) {
          console.error("Failed to fetch nearby ambulances:", error)
        }
      }
      fetchAmbulances()
    }
  }, [userCoordinates])
  const [mapError, setMapError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)

  const [hospitals, setHospitals] = useState([])
  const [requestId, setRequestId] = useState(null)
  const [currentStatus, setCurrentStatus] = useState(null)

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

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      script.onerror = () => setMapError('Failed to load Google Maps API')
      document.head.appendChild(script)
    }

    loadGoogleMapsAPI()

    return () => {
      // Clean up markers
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
    }
  }, [])

  // Initialize map when modal opens and API is loaded
  useEffect(() => {
    if (showMap && mapLoaded && mapContainerRef.current && !mapInstanceRef.current) {
      initMap()
    }
  }, [showMap, mapLoaded])

  // Reset map reference when closing modal
  useEffect(() => {
    if (!showMap) {
      mapInstanceRef.current = null
    }
  }, [showMap])

  // Load hospitals from backend and calculate nearest
  const loadHospitals = async (coords) => {
    try {
      const response = await emergencyAPI.getHospitals({
        lat: coords?.lat,
        lng: coords?.lng
      })
      if (response?.data?.success) {
        const fetchedHospitals = response.data.data
        
        // Calculate distances if coordinates are available
        const userLat = coords?.lat || 19.0760
        const userLng = coords?.lng || 72.8777
        
        let nearest = null
        let minDistance = Infinity
        
        const updatedHospitals = fetchedHospitals.map(h => {
          const distanceVal = calculateDistance(userLat, userLng, h.coordinates.lat, h.coordinates.lng)
          const etaVal = Math.min(Math.ceil(distanceVal * 4), 30)
          
          const updated = {
            ...h,
            distance: `${distanceVal.toFixed(1)} km`,
            eta: `${etaVal} mins`,
            etaMinutes: etaVal
          }
          
          if (h.available && distanceVal < minDistance) {
            minDistance = distanceVal
            nearest = updated
          }
          
          return updated
        })
        
        setHospitals(updatedHospitals)
        
        if (nearest) {
          setSelectedHospital(nearest)
          setEta(nearest.etaMinutes)
          setCountdown(nearest.etaMinutes * 60)
        }
      }
    } catch (error) {
      console.error("Failed to load hospitals from backend:", error)
    }
  }

  const getRealAddressAndHospitals = async (coords) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`, {
        headers: {
          'User-Agent': 'HealthcareConsultationApp/1.0'
        }
      })
      const data = await res.json()
      if (data && data.display_name) {
        setLocation(data.display_name)
      } else {
        setLocation(`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`)
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err)
      setLocation(`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`)
    }
    loadHospitals(coords)
  }

  // Get user location
  useEffect(() => {
    const fallbackToIpGeo = async () => {
      try {
        const ipResponse = await fetch('https://ipapi.co/json/')
        const ipData = await ipResponse.json()
        if (ipData.latitude && ipData.longitude) {
          const coords = { lat: ipData.latitude, lng: ipData.longitude }
          setUserCoordinates(coords)
          await getRealAddressAndHospitals(coords)
          return
        }
      } catch (ipError) {
        console.error('IP Geolocation fallback failed:', ipError)
      }
      
      setLocation('Mumbai (Default)')
      const coords = { lat: 19.0760, lng: 72.8777 }
      setUserCoordinates(coords)
      loadHospitals(coords)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const coords = { lat: latitude, lng: longitude }
          setUserCoordinates(coords)
          getRealAddressAndHospitals(coords)
        },
        (error) => {
          console.warn('Browser Geolocation failed, falling back to IP Geolocation:', error.message)
          fallbackToIpGeo()
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      )
    } else {
      fallbackToIpGeo()
    }
  }, [])

  // Emergency countdown timer
  useEffect(() => {
    if (emergencyActive && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [emergencyActive, countdown])

  // Polling loop for active request
  useEffect(() => {
    if (!emergencyActive || !requestId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await emergencyAPI.getAmbulanceRequest(requestId)
        if (response?.data?.success) {
          const requestData = response.data.data
          setCurrentStatus(requestData.status)
          setCountdown(requestData.eta * 60)
          
          if (requestData.driverName) {
            setAmbulances([
              {
                id: requestData._id,
                number: requestData.ambulanceNumber || 'AMB-XXXX',
                hospital: requestData.hospitalId?.name || selectedHospital?.name || 'Assigned Hospital',
                distance: selectedHospital?.distance || 'N/A',
                eta: `${requestData.eta} mins`,
                phone: requestData.driverPhone || '+91 98765 43210',
                coordinates: requestData.currentLocation || requestData.hospitalId?.coordinates,
                driverName: requestData.driverName
              }
            ])
          }
          
          if (requestData.status === 'arrived') {
            clearInterval(pollInterval)
          }
          if (requestData.status === 'cancelled') {
            setEmergencyActive(false)
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error("Error polling ambulance status:", error)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [emergencyActive, requestId, selectedHospital])

  const initMap = () => {
    if (!mapContainerRef.current || !window.google) return

    try {
      const center = userCoordinates || { lat: 19.0760, lng: 72.8777 }

      const mapOptions = {
        center: center,
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true
      }

      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, mapOptions)
      updateMarkers()
      setMapError(null)
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map')
    }
  }

  // Update markers when data changes
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    // Add user marker
    if (userCoordinates) {
      const userMarker = new window.google.maps.Marker({
        position: userCoordinates,
        map: mapInstanceRef.current,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new window.google.maps.Size(40, 40)
        },
        title: "Your Location"
      })
      markersRef.current.push(userMarker)

      const userInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 5px; font-weight: bold;">Your Location</h4>
            <p style="margin: 0;">${location}</p>
          </div>
        `
      })

      userMarker.addListener('click', () => {
        userInfoWindow.open(mapInstanceRef.current, userMarker)
      })
    }

    if (emergencyActive) {
      // 1. Draw hospital location
      if (selectedHospital) {
        const hospPos = selectedHospital.coordinates || (selectedHospital.lat && selectedHospital.lng ? { lat: selectedHospital.lat, lng: selectedHospital.lng } : null)
        if (hospPos) {
          const hospitalMarker = new window.google.maps.Marker({
            position: hospPos,
            map: mapInstanceRef.current,
            label: {
              text: 'H',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#ef4444', // Red for hospital
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            },
            title: selectedHospital.name
          })
          markersRef.current.push(hospitalMarker)

          const hospInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h4 style="margin: 0 0 5px; font-weight: bold;">${selectedHospital.name}</h4>
                <p style="margin: 0; font-size: 12px;">Origin Hospital</p>
                <p style="margin: 0; font-size: 12px;">📞 ${selectedHospital.phone}</p>
              </div>
            `
          })
          hospitalMarker.addListener('click', () => {
            hospInfoWindow.open(mapInstanceRef.current, hospitalMarker)
          })

          // 2. Draw Polyline from Hospital to User coordinates
          if (userCoordinates) {
            const pathCoordinates = [hospPos, userCoordinates]
            const routePath = new window.google.maps.Polyline({
              path: pathCoordinates,
              geodesic: true,
              strokeColor: '#3b82f6', // Nice blue for route path
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: mapInstanceRef.current
            })
            polylineRef.current = routePath
          }
        }
      }

      // 3. Draw Ambulance Live Location (comes from backend by polling)
      if (ambulances.length > 0) {
        const amb = ambulances[0]
        const ambPos = amb.coordinates
        if (ambPos) {
          const ambulanceMarker = new window.google.maps.Marker({
            position: ambPos,
            map: mapInstanceRef.current,
            label: {
              text: 'A',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#10b981', // Green for active ambulance
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            },
            title: `Ambulance: ${amb.number}`
          })
          markersRef.current.push(ambulanceMarker)

          const ambInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h4 style="margin: 0 0 5px; font-weight: bold;">Ambulance ${amb.number}</h4>
                <p style="margin: 0; font-size: 12px;"><b>Driver:</b> ${amb.driverName}</p>
                <p style="margin: 0; font-size: 12px;"><b>Phone:</b> ${amb.phone}</p>
                <p style="margin: 0; font-size: 12px;"><b>ETA:</b> ${amb.eta}</p>
                <p style="margin: 0; font-size: 12px;"><b>Coordinates:</b> ${ambPos.lat.toFixed(4)}, ${ambPos.lng.toFixed(4)}</p>
              </div>
            `
          })
          ambulanceMarker.addListener('click', () => {
            ambInfoWindow.open(mapInstanceRef.current, ambulanceMarker)
          })
        }
      }
    } else {
      // Draw all available hospitals when not in active emergency
      hospitals.filter(h => h.available).forEach(hospital => {
        const position = hospital.coordinates || (hospital.lat && hospital.lng ? { lat: hospital.lat, lng: hospital.lng } : null)
        if (!position) return

        const marker = new window.google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          label: {
            text: 'H',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          },
          title: hospital.name
        })

        const content = `
          <div style="padding: 12px; max-width: 250px;">
            <h4 style="margin: 0 0 8px; font-weight: bold; font-size: 16px;">
              ${hospital.name}
            </h4>
            ${hospital.address ? `<p style="margin: 5px 0; font-size: 13px;">📍 ${hospital.address}</p>` : ''}
            <p style="margin: 5px 0; font-size: 13px;">📏 Distance: ${hospital.distance || 'N/A'}</p>
            ${hospital.eta ? `<p style="margin: 5px 0; font-size: 13px;">⏱️ ETA: ${hospital.eta}</p>` : ''}
            ${hospital.phone ? `
              <a href="tel:${hospital.phone}" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 4px; font-size: 13px;">
                📞 Call Now
              </a>
            ` : ''}
          </div>
        `

        const infoWindow = new window.google.maps.InfoWindow({
          content: content
        })

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })

        markersRef.current.push(marker)
      })
    }

    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markersRef.current.forEach(marker => bounds.extend(marker.getPosition()))
      mapInstanceRef.current.fitBounds(bounds)
    }
  }

  // Hook to update markers when dependency arrays change
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      updateMarkers()
    }
  }, [ambulances, hospitals, emergencyActive, showMap, mapLoaded])

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleEmergencyRequest = async () => {
    if (!selectedHospital) {
      alert("No available nearby hospital found")
      return
    }

    setIsLoading(true)
    try {
      const response = await emergencyAPI.requestAmbulance({
        hospitalId: selectedHospital._id,
        pickupLocation: {
          lat: userCoordinates?.lat || 19.0760,
          lng: userCoordinates?.lng || 72.8777,
          address: location
        },
        eta: eta,
        providerName: selectedAmbulanceProvider
      })

      if (response?.data?.success) {
        const requestData = response.data.data
        setRequestId(requestData._id)
        setEmergencyActive(true)
        setCurrentStatus(requestData.status)

        // Show map tracking
        setMapHospitals([selectedHospital])
        setShowMap(true)
      }
    } catch (error) {
      console.error("Failed to request ambulance:", error)
      alert("Emergency request failed. Please call 108 directly.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyCall = (number) => {
    window.location.href = `tel:${number}`
  }

  const handleCancelRequest = async () => {
    if (!requestId) {
      setEmergencyActive(false)
      return
    }
    
    try {
      await emergencyAPI.cancelAmbulanceRequest(requestId)
      setEmergencyActive(false)
      setRequestId(null)
      setCurrentStatus(null)
      alert("Emergency request has been cancelled.")
    } catch (error) {
      console.error("Failed to cancel emergency request:", error)
      setEmergencyActive(false)
    }
  }

  const getStatusDisplay = () => {
    switch (currentStatus) {
      case 'waiting_hospital_response':
        return {
          title: "Waiting for Hospital Response...",
          desc: "Hospital is confirming ambulance availability and dispatching the crew",
          colorClass: "bg-yellow-50 border-yellow-200 text-yellow-800"
        }
      case 'dispatched':
        return {
          title: "Emergency Ambulance Dispatched!",
          desc: "Emergency unit is on the way to your location",
          colorClass: "bg-red-50 border-red-200 text-red-800"
        }
      case 'arrived':
        return {
          title: "Ambulance Arrived!",
          desc: "The ambulance has reached your pickup location",
          colorClass: "bg-green-50 border-green-200 text-green-800"
        }
      default:
        return {
          title: "Emergency Ambulance Dispatched!",
          desc: "Emergency unit is on the way to your location",
          colorClass: "bg-red-50 border-red-200 text-red-800"
        }
    }
  }

  const handleDownloadPDF = () => {
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
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
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
                {/* Ambulance Provider Dropdown */}
                {availableAmbulances.length > 0 && (
                  <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-100 rounded-xl p-4 text-left">
                    <label htmlFor="ambulance-provider-select" className="block text-sm font-bold text-red-700 mb-2">
                      Select Preferred Ambulance Provider (Dynamic)
                    </label>
                    <select
                      id="ambulance-provider-select"
                      value={selectedAmbulanceProvider}
                      onChange={(e) => setSelectedAmbulanceProvider(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-red-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm font-medium cursor-pointer"
                    >
                      {[...new Set(availableAmbulances.map(a => a.providerName))].map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Emergency Button */}
                <div className="text-center mb-8 md:mb-12">
                  <button
                    onClick={handleEmergencyRequest}
                    disabled={isLoading}
                    className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-6 md:px-16 md:py-8 rounded-full text-lg md:text-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all mb-4 md:mb-6 animate-pulse w-full max-w-md mx-auto disabled:opacity-70"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="animate-spin h-5 w-5 md:h-8 md:w-8 mr-3" />
                        Locating nearest ambulance...
                      </span>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 md:w-10 md:h-10 inline mr-2 md:mr-4" />
                        REQUEST EMERGENCY AMBULANCE
                      </>
                    )}
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
                            Beds: {hospital.beds}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 truncate">{hospital.address}</p>
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
                <div className={`border-4 rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 animate-pulse ${getStatusDisplay().colorClass}`}>
                  <Ambulance className="w-16 h-16 md:w-20 md:h-20 text-red-600 mx-auto mb-3 md:mb-4" />
                  <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2">
                    {getStatusDisplay().title}
                  </h2>
                  <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
                    {getStatusDisplay().desc}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-white p-3 md:p-4 rounded-xl">
                      <div className="text-xs md:text-sm text-gray-500 mb-1">Estimated Arrival</div>
                      <div className="text-2xl md:text-4xl font-bold text-red-600">
                        {currentStatus === 'waiting_hospital_response' ? '--:--' : formatTime(countdown)}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">Minutes:Seconds</div>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl">
                      <div className="text-xs md:text-sm text-gray-500 mb-1">Ambulance Number</div>
                      <div className="text-lg md:text-2xl font-bold text-gray-800">
                        {ambulances.length > 0 && currentStatus !== 'waiting_hospital_response' ? ambulances[0].number : 'Assigning...'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {currentStatus === 'waiting_hospital_response' ? 'Pending confirmation' : 'Live Tracking Active'}
                      </div>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl">
                      <div className="text-xs md:text-sm text-gray-500 mb-1">Assigned Hospital</div>
                      <div className="text-lg md:text-xl font-bold text-gray-800">
                        {selectedHospital?.name || 'Apollo Hospital'}
                      </div>
                      {selectedHospital?.phone && (
                        <div className="text-sm font-semibold text-red-600 my-0.5">
                          📞 {selectedHospital.phone}
                        </div>
                      )}
                      <div className="text-xs md:text-sm text-gray-500">
                        {selectedHospital?.distance || '2.3 km'} away
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                      <button 
                        onClick={() => handleEmergencyCall(selectedHospital?.phone || '108')}
                        className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-lg hover:bg-red-700 w-full sm:w-auto font-medium"
                      >
                        <PhoneCall className="w-4 h-4 md:w-5 md:h-5" />
                        Call Hospital
                      </button>
                      <button 
                        onClick={() => setShowMap(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                      >
                        <Map className="w-4 h-4 md:w-5 md:h-5" />
                        Track on Map
                      </button>
                      <button className="flex items-center justify-center gap-2 border border-red-600 text-red-600 px-4 py-3 md:px-6 md:py-3 rounded-lg hover:bg-red-50 w-full sm:w-auto">
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                        Chat with Dispatcher
                      </button>
                    </div>
                    
                    <button
                      onClick={handleCancelRequest}
                      className="text-gray-600 hover:text-gray-800 underline text-sm md:text-base"
                    >
                      Cancel Emergency Request
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left bg-yellow-50 border border-yellow-200 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6">
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

                {/* Nearby Hospitals Contact Directory */}
                <div className="mt-6 text-left bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-red-600 animate-bounce" />
                    Call Nearby Hospitals directly for Ambulance:
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {hospitals.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{h.name}</div>
                          <div className="text-xs text-gray-500 my-0.5">{h.address}</div>
                          <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {h.phone}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEmergencyCall(h.phone)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <PhoneCall className="w-3 h-3" />
                          Call
                        </button>
                      </div>
                    ))}
                  </div>
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

      {/* Map Modal with Real Google Maps */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                {emergencyActive ? 'Live Ambulance Tracking' : 'Nearby Hospitals Map'}
              </h3>
              <button 
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative">
              {/* Map Container */}
              <div 
                ref={mapContainerRef} 
                className="w-full h-96 md:h-[500px]"
              />
              
              {/* Loading State */}
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {mapError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center p-4">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-gray-800 font-medium mb-2">Failed to load map</p>
                    <p className="text-sm text-gray-600 mb-4">{mapError}</p>
                    <button 
                      onClick={() => window.open('https://www.google.com/maps', '_blank')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Open in Google Maps
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Info Panel */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                    <span className="text-sm">Your Location</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">{emergencyActive ? 'Ambulance' : 'Hospital'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (userCoordinates) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${userCoordinates.lat},${userCoordinates.lng}`
                      window.open(url, '_blank')
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                >
                  <Map className="w-4 h-4 mr-1" />
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