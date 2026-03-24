import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

const DEFAULT_COORDINATES = { lat: 19.076, lng: 72.8777 }
const DEFAULT_LOCATION_LABEL = 'Mumbai, Maharashtra (default location)'

const hospitals = [
  {
    name: 'Apollo Hospital',
    distance: '2.3 km',
    eta: '8 mins',
    available: true,
    coordinates: { lat: 19.076, lng: 72.8777 },
    address: '21, Greams Lane, Off Greams Road, Chennai',
    phone: '+912266666666',
    beds: 24,
    ambulances: 3,
    rating: 4.5
  },
  {
    name: 'Fortis Hospital',
    distance: '3.1 km',
    eta: '10 mins',
    available: true,
    coordinates: { lat: 19.086, lng: 72.8877 },
    address: '154/9, Bannerghatta Road, Bangalore',
    phone: '+912277777777',
    beds: 18,
    ambulances: 2,
    rating: 4.3
  },
  {
    name: 'Kokilaben Hospital',
    distance: '4.5 km',
    eta: '12 mins',
    available: true,
    coordinates: { lat: 19.096, lng: 72.8977 },
    address: 'Rao Saheb Achutrao Patwardhan Marg, Mumbai',
    phone: '+912288888888',
    beds: 12,
    ambulances: 1,
    rating: 4.4
  },
  {
    name: 'Lilavati Hospital',
    distance: '5.2 km',
    eta: '15 mins',
    available: false,
    coordinates: { lat: 19.106, lng: 72.9077 },
    address: 'A-791, Bandra Reclamation, Bandra West, Mumbai',
    phone: '+912299999999',
    beds: 0,
    ambulances: 0,
    rating: 4.2
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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatTime = (seconds) => {
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const EmergencyPage = () => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [location, setLocation] = useState('Fetching location...')
  const [locationError, setLocationError] = useState('')
  const [userCoordinates, setUserCoordinates] = useState(null)
  const [eta, setEta] = useState(15)
  const [countdown, setCountdown] = useState(15 * 60)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ambulances, setAmbulances] = useState([])
  const [mapError, setMapError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowsRef = useRef([])
  const mapsScriptRef = useRef(null)

  const availableHospitals = useMemo(
    () => hospitals.filter((hospital) => hospital.available),
    []
  )

  const clearMapOverlays = useCallback(() => {
    markersRef.current.forEach((marker) => {
      if (marker?.map) {
        marker.map = null
      } else if (typeof marker?.setMap === 'function') {
        marker.setMap(null)
      }
    })
    markersRef.current = []
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close())
    infoWindowsRef.current = []
  }, [])

  const calculateNearestHospital = useCallback((userLat, userLng) => {
    let nearest = null
    let minDistance = Infinity

    availableHospitals.forEach((hospital) => {
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
    })

    if (nearest) {
      const calculatedEta = Math.min(Math.ceil(minDistance * 4), 30)
      setEta(calculatedEta)
      setCountdown(calculatedEta * 60)
      setSelectedHospital(nearest)
    }
  }, [availableHospitals])

  const setFallbackLocation = useCallback(
    (message) => {
      setUserCoordinates(DEFAULT_COORDINATES)
      setLocation(DEFAULT_LOCATION_LABEL)
      setLocationError(message)
      calculateNearestHospital(DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng)
    },
    [calculateNearestHospital]
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      setFallbackLocation('Geolocation is not supported by this browser. Using default location.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserCoordinates({ lat: latitude, lng: longitude })
        setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`)
        setLocationError('')
        calculateNearestHospital(latitude, longitude)
      },
      (error) => {
        console.error('Error getting location:', error)

        const message =
          error.code === 1
            ? 'Location permission denied. Using default location.'
            : 'Unable to fetch your location. Using default location.'

        setFallbackLocation(message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000
      }
    )
  }, [calculateNearestHospital, setFallbackLocation])

  useEffect(() => {
    if (!emergencyActive) return undefined

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [emergencyActive])

  useEffect(() => {
    let cancelled = false

    const loadGoogleMapsAPI = async () => {
      if (window.google?.maps?.Map && window.google?.maps?.marker?.AdvancedMarkerElement) {
        setMapLoaded(true)
        setMapError(null)
        return
      }

      const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

      if (!googleMapsApiKey) {
        setMapError('Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.')
        return
      }

      setMapLoading(true)

      try {
        if (!mapsScriptRef.current) {
          const existingScript = document.querySelector('script[data-google-maps-loader="true"]')

          if (existingScript) {
            mapsScriptRef.current = existingScript
          } else {
            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,marker&loading=async`
            script.async = true
            script.defer = true
            script.dataset.googleMapsLoader = 'true'
            document.head.appendChild(script)
            mapsScriptRef.current = script
          }
        }

        await new Promise((resolve, reject) => {
          if (window.google?.maps?.Map) {
            resolve()
            return
          }

          const script = mapsScriptRef.current
          const handleLoad = () => resolve()
          const handleError = () => reject(new Error('Failed to load Google Maps API'))

          script.addEventListener('load', handleLoad, { once: true })
          script.addEventListener('error', handleError, { once: true })
        })

        if (window.google?.maps?.importLibrary) {
          await Promise.all([
            window.google.maps.importLibrary('maps'),
            window.google.maps.importLibrary('marker')
          ])
        }

        if (!cancelled) {
          setMapLoaded(true)
          setMapError(null)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Google Maps load error:', error)
          setMapError('Failed to load Google Maps API')
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false)
        }
      }
    }

    loadGoogleMapsAPI()

    return () => {
      cancelled = true
      clearMapOverlays()
    }
  }, [clearMapOverlays])

  const createAdvancedMarker = useCallback((map, position, labelText, color, title) => {
    const markerContent = document.createElement('div')
    markerContent.style.width = '22px'
    markerContent.style.height = '22px'
    markerContent.style.borderRadius = '9999px'
    markerContent.style.background = color
    markerContent.style.border = '2px solid #ffffff'
    markerContent.style.color = '#ffffff'
    markerContent.style.display = 'flex'
    markerContent.style.alignItems = 'center'
    markerContent.style.justifyContent = 'center'
    markerContent.style.fontSize = '11px'
    markerContent.style.fontWeight = '700'
    markerContent.textContent = labelText

    return new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title,
      content: markerContent
    })
  }, [])

  const initMap = useCallback(() => {
    if (!showMap || !mapContainerRef.current || !window.google?.maps?.Map) return

    try {
      clearMapOverlays()

      const center = userCoordinates || DEFAULT_COORDINATES
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map
      const bounds = new window.google.maps.LatLngBounds()

      if (userCoordinates) {
        const userMarker = createAdvancedMarker(map, userCoordinates, 'U', '#2563eb', 'Your Location')

        const userInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 5px; font-weight: bold;">Your Location</h4>
              <p style="margin: 0;">${location}</p>
            </div>
          `
        })

        userMarker.addListener('click', () => {
          userInfoWindow.open({ map, anchor: userMarker })
        })

        markersRef.current.push(userMarker)
        infoWindowsRef.current.push(userInfoWindow)
        bounds.extend(userCoordinates)
      }

      const items = emergencyActive ? ambulances : availableHospitals

      items.forEach((item) => {
        const position =
          item.coordinates || (item.lat && item.lng ? { lat: item.lat, lng: item.lng } : null)

        if (!position) return

        const marker = createAdvancedMarker(
          map,
          position,
          emergencyActive ? 'A' : 'H',
          emergencyActive ? '#10b981' : '#ef4444',
          item.name || item.hospital || 'Location'
        )

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 250px;">
              <h4 style="margin: 0 0 8px; font-weight: bold; font-size: 16px;">
                ${item.name || item.hospital || 'Medical Facility'}
              </h4>
              ${item.address ? `<p style="margin: 5px 0; font-size: 13px;">Address: ${item.address}</p>` : ''}
              <p style="margin: 5px 0; font-size: 13px;">Distance: ${item.distance || 'N/A'}</p>
              ${item.eta ? `<p style="margin: 5px 0; font-size: 13px;">ETA: ${item.eta}</p>` : ''}
              ${item.phone ? `<p style="margin: 5px 0; font-size: 13px;">Phone: ${item.phone}</p>` : ''}
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open({ map, anchor: marker })
        })

        markersRef.current.push(marker)
        infoWindowsRef.current.push(infoWindow)
        bounds.extend(position)
      })

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds)
      }

      setMapError(null)
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map')
    }
  }, [
    ambulances,
    availableHospitals,
    clearMapOverlays,
    createAdvancedMarker,
    emergencyActive,
    location,
    showMap,
    userCoordinates
  ])

  useEffect(() => {
    if (!showMap || !mapLoaded) {
      if (!showMap) {
        clearMapOverlays()
        mapInstanceRef.current = null
      }
      return
    }

    initMap()
  }, [clearMapOverlays, initMap, mapLoaded, showMap])

  const handleEmergencyRequest = () => {
    setIsLoading(true)

    const availableAmbulances = availableHospitals
      .filter((hospital) => hospital.ambulances > 0)
      .flatMap((hospital) =>
        Array.from({ length: hospital.ambulances }, (_, index) => ({
          id: `${hospital.name}-ambulance-${index + 1}`,
          number: `AMB-${Math.floor(1000 + Math.random() * 9000)}`,
          hospital: hospital.name,
          distance: hospital.distance,
          eta: hospital.eta,
          phone: hospital.phone,
          coordinates: hospital.coordinates,
          address: hospital.address,
          type: index === 0 ? 'Advanced Life Support' : 'Basic Life Support'
        }))
      )
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))

    setAmbulances(availableAmbulances)

    window.setTimeout(() => {
      setEmergencyActive(true)
      setIsLoading(false)
      setShowMap(availableAmbulances.length > 0)
      setCountdown(15 * 60)
      setEta(15)
    }, 1500)
  }

  const handleEmergencyCall = (number) => {
    window.location.href = `tel:${number}`
  }

  const handleCallAmbulance = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const handleDownloadPDF = () => {
    const textContent = `
FIRST AID EMERGENCY GUIDE

1. ASSESS THE SITUATION
- Check for danger to yourself and others
- Determine if the person is conscious
- Check breathing and pulse

2. CALL FOR HELP
- National Emergency: 112
- Ambulance: 108
- Police: 100
- Fire: 101

3. BASIC FIRST AID PROCEDURES
- CPR: 100-120 compressions per minute
- Apply direct pressure to bleeding
- For choking, give back blows and abdominal thrusts

4. EMERGENCY CONTACTS
- Family Doctor: __________
- Emergency Contact: __________
- Insurance Provider: __________

This guide is for informational purposes only.
Always seek professional medical help in emergencies.
    `.trim()

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'First_Aid_Emergency_Guide.txt'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)
  }

  const openGoogleMaps = (destination) => {
    if (!destination) return

    if (userCoordinates) {
      const url = `https://www.google.com/maps/dir/${userCoordinates.lat},${userCoordinates.lng}/${destination.lat},${destination.lng}`
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-4 md:py-8">
      <div className="container mx-auto max-w-6xl px-3 md:px-4">
        <div className="mb-4 md:mb-6">
          <Link
            to="/services"
            className="inline-flex items-center rounded-full bg-white px-3 py-2 text-sm text-red-600 shadow hover:text-red-700 md:px-4 md:text-base"
          >
            <ChevronLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            Back to Services
          </Link>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-xl md:mb-8 md:rounded-2xl">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-4 text-center text-white md:p-8">
            <Ambulance className="mx-auto mb-3 h-12 w-12 md:mb-4 md:h-16 md:w-16" />
            <h1 className="mb-2 text-2xl font-bold md:text-4xl">Emergency Services</h1>
            <p className="text-sm text-red-100 md:text-lg">
              24/7 Rapid Response • GPS Tracking • Hospital Coordination
            </p>
          </div>

          <div className="p-4 md:p-8">
            {!emergencyActive ? (
              <div>
                <div className="mb-8 text-center md:mb-12">
                  <button
                    onClick={handleEmergencyRequest}
                    disabled={isLoading}
                    className="relative mx-auto mb-4 w-full max-w-md rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-8 py-6 text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-2xl disabled:opacity-70 md:mb-6 md:px-16 md:py-8 md:text-2xl"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader className="mr-3 h-5 w-5 animate-spin md:h-8 md:w-8" />
                        Locating nearest ambulance...
                      </span>
                    ) : (
                      <>
                        <AlertCircle className="mr-2 inline h-6 w-6 md:mr-4 md:h-10 md:w-10" />
                        REQUEST EMERGENCY AMBULANCE
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-600 md:text-base">
                    Click only in case of genuine emergency
                  </p>
                </div>

                <div className="mb-8 md:mb-12">
                  <h3 className="mb-4 text-center text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">
                    Emergency Contact Numbers
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
                    {emergencyNumbers.map((contact) => (
                      <button
                        key={contact.number}
                        onClick={() => handleEmergencyCall(contact.number)}
                        className="rounded-xl border border-red-100 bg-red-50 p-4 text-center transition-colors hover:bg-red-100 active:scale-95 md:p-6"
                      >
                        <Phone className="mx-auto mb-2 h-6 w-6 text-red-600 md:mb-3 md:h-8 md:w-8" />
                        <h4 className="mb-1 text-sm font-bold text-gray-800 md:text-base">
                          {contact.name}
                        </h4>
                        <div className="text-lg font-bold text-red-600 hover:text-red-700 md:text-2xl">
                          {contact.number}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Tap to call</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 md:mb-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start">
                      <MapPin className="mr-2 mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Your Location</p>
                        <p className="font-medium text-gray-800">{location}</p>
                        {locationError ? (
                          <p className="mt-1 text-sm text-amber-700">{locationError}</p>
                        ) : null}
                      </div>
                    </div>
                    {userCoordinates ? (
                      <button
                        onClick={() => openGoogleMaps(userCoordinates)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Map className="mr-1 h-4 w-4" />
                        View on Map
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mb-6 md:mb-8">
                  <div className="mb-4 flex flex-col justify-between md:mb-6 md:flex-row md:items-center">
                    <h3 className="mb-2 text-xl font-bold text-gray-800 md:mb-0 md:text-2xl">
                      Nearby Hospitals
                    </h3>
                    <button
                      onClick={() => setShowMap(true)}
                      className="flex items-center text-sm text-red-600 hover:text-red-700 md:text-base"
                    >
                      <Map className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      View on Map
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                    {hospitals.map((hospital) => (
                      <div
                        key={hospital.name}
                        className={`rounded-xl border p-3 md:p-4 ${
                          hospital.available ? 'hover:border-red-300 hover:bg-red-50' : 'opacity-60'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between md:mb-3">
                          <h4 className="text-sm font-bold text-gray-800 md:text-base">
                            {hospital.name}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              hospital.available
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {hospital.available ? 'Available' : 'Full'}
                          </span>
                        </div>
                        <div className="mb-3 flex items-center justify-between text-xs text-gray-600 md:text-sm">
                          <span className="flex items-center">
                            <Navigation className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                            {hospital.distance}
                          </span>
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                            ETA: {hospital.eta}
                          </span>
                          <span className="flex items-center">
                            <Ambulance className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                            Beds: {hospital.beds}
                          </span>
                        </div>
                        <p className="mb-3 truncate text-xs text-gray-500">{hospital.address}</p>
                        {hospital.available ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCallAmbulance(hospital.phone)}
                              className="flex flex-1 items-center justify-center rounded-lg bg-red-600 py-2 text-sm text-white hover:bg-red-700"
                            >
                              <PhoneCall className="mr-1 h-4 w-4" />
                              Call
                            </button>
                            <button
                              onClick={() => openGoogleMaps(hospital.coordinates)}
                              className="flex flex-1 items-center justify-center rounded-lg border border-red-600 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Navigation className="mr-1 h-4 w-4" />
                              Directions
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-4 md:rounded-2xl md:p-6">
                  <h3 className="mb-3 flex items-center text-xl font-bold text-gray-800 md:mb-4 md:text-2xl">
                    <Heart className="mr-2 h-5 w-5 text-red-600 md:mr-3 md:h-6 md:w-6" />
                    First Aid Tips
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                    {firstAidTips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2 rounded-lg bg-white p-2 md:gap-3 md:p-3">
                        <div className="flex-shrink-0 rounded bg-red-100 p-1 text-red-600">
                          <Cross className="h-3 w-3 md:h-4 md:w-4" />
                        </div>
                        <span className="text-sm md:text-base">{tip}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleDownloadPDF}
                    className="mt-4 flex items-center gap-2 text-sm text-red-600 hover:text-red-700 md:mt-6 md:text-base"
                  >
                    <Download className="h-4 w-4 md:h-5 md:w-5" />
                    Download First Aid Guide
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6 rounded-xl border-4 border-red-200 bg-red-50 p-4 md:mb-8 md:rounded-2xl md:p-8">
                  <Ambulance className="mx-auto mb-3 h-16 w-16 text-red-600 md:mb-4 md:h-20 md:w-20" />
                  <h2 className="mb-2 text-xl font-bold text-gray-800 md:text-3xl">
                    Emergency Ambulance Dispatched!
                  </h2>
                  <p className="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">
                    Emergency unit is on the way to your location
                  </p>

                  <div className="mb-6 grid grid-cols-1 gap-4 md:mb-8 md:grid-cols-3 md:gap-6">
                    <div className="rounded-xl bg-white p-3 md:p-4">
                      <div className="mb-1 text-xs text-gray-500 md:text-sm">Estimated Arrival</div>
                      <div className="text-2xl font-bold text-red-600 md:text-4xl">
                        {formatTime(countdown)}
                      </div>
                      <div className="text-xs text-gray-500 md:text-sm">Minutes:Seconds</div>
                    </div>
                    <div className="rounded-xl bg-white p-3 md:p-4">
                      <div className="mb-1 text-xs text-gray-500 md:text-sm">Ambulance Number</div>
                      <div className="text-lg font-bold text-gray-800 md:text-2xl">
                        {ambulances.length > 0 ? ambulances[0].number : 'AMB-XXXX'}
                      </div>
                      <div className="text-xs text-gray-500 md:text-sm">Live Tracking Active</div>
                    </div>
                    <div className="rounded-xl bg-white p-3 md:p-4">
                      <div className="mb-1 text-xs text-gray-500 md:text-sm">Assigned Hospital</div>
                      <div className="text-lg font-bold text-gray-800 md:text-xl">
                        {selectedHospital?.name || 'Apollo Hospital'}
                      </div>
                      <div className="text-xs text-gray-500 md:text-sm">
                        {selectedHospital?.distance || '2.3 km'} away
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row md:gap-4">
                      <button
                        onClick={() => handleEmergencyCall('108')}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 sm:w-auto md:px-6"
                      >
                        <PhoneCall className="h-4 w-4 md:h-5 md:w-5" />
                        Call Ambulance
                      </button>
                      <button
                        onClick={() => setShowMap(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 sm:w-auto md:px-6"
                      >
                        <Map className="h-4 w-4 md:h-5 md:w-5" />
                        Track on Map
                      </button>
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-600 px-4 py-3 text-red-600 hover:bg-red-50 sm:w-auto md:px-6">
                        <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                        Chat with Dispatcher
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setEmergencyActive(false)
                        setShowMap(false)
                        setCountdown(15 * 60)
                      }}
                      className="text-sm text-gray-600 underline hover:text-gray-800 md:text-base"
                    >
                      Cancel Emergency Request
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-left md:rounded-2xl md:p-6">
                  <h3 className="mb-3 flex items-center text-lg font-bold text-gray-800 md:mb-4 md:text-xl">
                    <AlertCircle className="mr-2 h-5 w-5 text-yellow-600 md:mr-3 md:h-6 md:w-6" />
                    While Waiting for Ambulance:
                  </h3>
                  <ul className="space-y-2 md:space-y-3">
                    {[
                      'Stay with the patient and keep them calm',
                      'Keep doors and gates unlocked for easy access',
                      'Have someone wait outside to guide the ambulance',
                      'Prepare medical documents and insurance information'
                    ].map((item, index) => (
                      <li key={item} className="flex items-start gap-2 md:gap-3">
                        <span className="flex-shrink-0 rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800">
                          {index + 1}
                        </span>
                        <span className="text-sm md:text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {[
            {
              icon: <Clock className="h-6 w-6 md:h-8 md:w-8" />,
              title: '24/7 Availability',
              desc: 'Round-the-clock emergency services with rapid response teams'
            },
            {
              icon: <Shield className="h-6 w-6 md:h-8 md:w-8" />,
              title: 'Trained Professionals',
              desc: 'Certified paramedics and emergency medical technicians'
            },
            {
              icon: <Users className="h-6 w-6 md:h-8 md:w-8" />,
              title: 'Family Alerts',
              desc: 'Automatic notifications to emergency contacts'
            }
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white p-4 text-center shadow md:p-6">
              <div className="mb-3 flex justify-center text-red-600 md:mb-4">{feature.icon}</div>
              <h3 className="mb-2 text-sm font-bold text-gray-800 md:text-base">{feature.title}</h3>
              <p className="text-xs text-gray-600 md:text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showMap ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white">
            <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
              <h3 className="text-lg font-bold text-gray-800">
                {emergencyActive ? 'Live Ambulance Tracking' : 'Nearby Hospitals Map'}
              </h3>
              <button
                onClick={() => setShowMap(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1">
              <div ref={mapContainerRef} className="h-96 w-full md:h-[500px]" />

              {mapLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-red-600" />
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              ) : null}

              {mapError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="p-4 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
                    <p className="mb-2 font-medium text-gray-800">Failed to load map</p>
                    <p className="mb-4 text-sm text-gray-600">{mapError}</p>
                    <button
                      onClick={() => window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer')}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Open in Google Maps
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded-full bg-blue-600" />
                    <span className="text-sm">Your Location</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 rounded-full bg-red-500" />
                    <span className="text-sm">{emergencyActive ? 'Ambulance' : 'Hospital'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (userCoordinates) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${userCoordinates.lat},${userCoordinates.lng}`
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Map className="mr-1 h-4 w-4" />
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default EmergencyPage
