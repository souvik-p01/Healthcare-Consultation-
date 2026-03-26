import React, { useState, useEffect, useRef } from 'react'
import {
  Pill,
  ChevronLeft,
  Search,
  Filter,
  ShoppingCart,
  Truck,
  Clock,
  MapPin,
  Star,
  Shield,
  Upload,
  Plus,
  Minus,
  X,
  CheckCircle,
  CreditCard,
  User,
  Phone,
  Home,
  Navigation,
  Package,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Info
} from 'lucide-react'
import PaymentGateway from '../components/PaymentGateway';

// Medicine Detail Modal with Charts
const MedicineDetailModal = ({ medicine, onClose, onAddToCart }) => {
  if (!medicine) return null

  const priceHistory = [
    { month: 'Jan', price: Math.round((medicine.price || 100) * 1.15) },
    { month: 'Feb', price: Math.round((medicine.price || 100) * 1.10) },
    { month: 'Mar', price: Math.round((medicine.price || 100) * 1.08) },
    { month: 'Apr', price: Math.round((medicine.price || 100) * 1.05) },
    { month: 'May', price: Math.round((medicine.price || 100) * 1.02) },
    { month: 'Jun', price: medicine.price || 100 },
  ]

  const stockData = [
    { pharmacy: 'Apollo', stock: 85, color: '#10b981' },
    { pharmacy: 'MedPlus', stock: 62, color: '#3b82f6' },
    { pharmacy: 'Wellness', stock: 45, color: '#f59e0b' },
    { pharmacy: 'Guardian', stock: 30, color: '#8b5cf6' },
  ]

  const maxPrice = Math.max(...priceHistory.map(d => d.price))
  const minPrice = Math.min(...priceHistory.map(d => d.price))
  const chartH = 120
  const chartW = 300
  const padX = 40
  const padY = 10

  const points = priceHistory.map((d, i) => {
    const x = padX + (i / (priceHistory.length - 1)) * (chartW - padX - 10)
    const y = padY + ((maxPrice - d.price) / (maxPrice - minPrice || 1)) * (chartH - padY * 2)
    return `${x},${y}`
  }).join(' ')

  const discount = medicine.discountPrice
    ? Math.round(((medicine.price - medicine.discountPrice) / medicine.price) * 100)
    : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">{medicine.name}</h2>
              {medicine.requiresPrescription && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Rx</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{medicine.brand} • {medicine.form}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Price & Stock Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">₹{medicine.discountPrice || medicine.price}</div>
              {medicine.discountPrice && (
                <div className="text-xs text-gray-400 line-through">₹{medicine.price}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">Current Price</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{medicine.stock}</div>
              <div className="text-xs text-gray-500 mt-1">Units in Stock</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{discount > 0 ? `${discount}%` : 'N/A'}</div>
              <div className="text-xs text-gray-500 mt-1">Discount</div>
            </div>
          </div>

          {/* Price Trend Line Chart */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Price Trend (Last 6 Months)</h3>
            </div>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 140 }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const y = padY + t * (chartH - padY * 2)
                const val = Math.round(maxPrice - t * (maxPrice - minPrice))
                return (
                  <g key={i}>
                    <line x1={padX} y1={y} x2={chartW - 10} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                    <text x={padX - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#9ca3af">₹{val}</text>
                  </g>
                )
              })}
              {/* Area fill */}
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`${points} ${chartW - 10},${chartH - padY} ${padX},${chartH - padY}`}
                fill="url(#priceGrad)"
              />
              {/* Line */}
              <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
              {/* Dots & labels */}
              {priceHistory.map((d, i) => {
                const x = padX + (i / (priceHistory.length - 1)) * (chartW - padX - 10)
                const y = padY + ((maxPrice - d.price) / (maxPrice - minPrice || 1)) * (chartH - padY * 2)
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#10b981" />
                    <text x={x} y={chartH - 2} textAnchor="middle" fontSize="8" fill="#6b7280">{d.month}</text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Stock Bar Chart */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">Stock Availability by Pharmacy</h3>
            </div>
            <div className="space-y-3">
              {stockData.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{item.pharmacy}</span>
                    <span className="font-medium">{item.stock} units</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${item.stock}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medicine Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Category:</span>
              <span className="font-medium">{medicine.category}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Pill className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Form:</span>
              <span className="font-medium">{medicine.form}</span>
            </div>
            <div className="col-span-2 flex items-start gap-2 text-gray-600">
              <Package className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-gray-500">Packaging:</span>
              <span className="font-medium">{medicine.packaging}</span>
            </div>
            {medicine.description && (
              <div className="col-span-2 bg-blue-50 rounded-lg p-3 text-xs text-gray-600">
                {medicine.description}
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={() => { onAddToCart(medicine); onClose(); }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart — ₹{medicine.discountPrice || medicine.price}
          </button>
        </div>
      </div>
    </div>
  )
}

// Google Maps Component for Pharmacy Map
const PharmacyMap = ({ pharmacies, userLocation, onPharmacySelect }) => {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!window.google || !mapRef.current) return

    const center = userLocation || { lat: 19.0760, lng: 72.8777 }

    const mapOptions = {
      center: center,
      zoom: 14,
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

    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add user marker
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        },
        title: "Your Location"
      })
      markersRef.current.push(userMarker)

      const userInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 5px; font-weight: bold;">Your Location</h4>
            <p style="margin: 0;">You are here</p>
          </div>
        `
      })

      userMarker.addListener('click', () => {
        userInfoWindow.open(googleMapRef.current, userMarker)
      })
    }

    // Add pharmacy markers
    pharmacies.forEach((pharmacy, index) => {
      const marker = new window.google.maps.Marker({
        position: pharmacy.coordinates,
        map: googleMapRef.current,
        icon: {
          url: index === 0 
            ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        },
        title: pharmacy.name
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px;">
            <h4 style="margin: 0 0 8px; font-weight: bold; font-size: 16px;">${pharmacy.name}</h4>
            <p style="margin: 5px 0; font-size: 13px;">📍 ${pharmacy.address}</p>
            <p style="margin: 5px 0; font-size: 13px;">📏 Distance: ${pharmacy.distance}</p>
            <p style="margin: 5px 0; font-size: 13px;">⏱️ Delivery: ${pharmacy.deliveryTime}</p>
            <p style="margin: 5px 0; font-size: 13px;">⭐ Rating: ${pharmacy.rating}</p>
            <button onclick="window.selectPharmacy(${index})" 
              style="margin-top: 8px; padding: 6px 12px; background-color: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
              Select Pharmacy
            </button>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markersRef.current.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition())
        }
      })
      googleMapRef.current.fitBounds(bounds)
    }

    // Make selectPharmacy available globally
    window.selectPharmacy = (index) => {
      if (onPharmacySelect) {
        onPharmacySelect(pharmacies[index])
      }
    }

    return () => {
      delete window.selectPharmacy
    }
  }, [pharmacies, userLocation])

  return <div ref={mapRef} className="w-full h-full" />
}

// Store Detail View Component with Map
const StoreDetailView = ({ pharmacy, medicines, onClose, onAddToCart, userLocation }) => {
  const mapRef = useRef(null)
  const availableMeds = medicines.filter(med => pharmacy.availableMedicines.includes(med.id))

  useEffect(() => {
    if (!window.google || !mapRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: pharmacy.coordinates,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false
    })

    // Pharmacy marker
    new window.google.maps.Marker({
      position: pharmacy.coordinates,
      map: map,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      title: pharmacy.name
    })

    // User location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        },
        title: "Your Location"
      })

      // Draw route
      const directionsService = new window.google.maps.DirectionsService()
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#10b981',
          strokeWeight: 4
        }
      })

      directionsService.route(
        {
          origin: userLocation,
          destination: pharmacy.coordinates,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result)
          }
        }
      )
    }
  }, [pharmacy, userLocation])
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">{pharmacy.name}</h3>
              <p className="text-sm md:text-base text-gray-600 mt-1">{pharmacy.address}</p>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                  {pharmacy.distance} away
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                  {pharmacy.deliveryTime} delivery
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                  {pharmacy.rating} Rating
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                  {pharmacy.phone}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Store Map */}
          <div className="mb-6">
            <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3">Store Location</h4>
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <div ref={mapRef} className="w-full h-full" />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat || 19.0760},${userLocation?.lng || 72.8777}&destination=${pharmacy.coordinates.lat},${pharmacy.coordinates.lng}&travelmode=driving`
                  window.open(url, '_blank')
                }}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </button>
            </div>
          </div>

          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-4">
            Available Medicines ({availableMeds.length})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {availableMeds.map((medicine) => (
              <div key={medicine.id} className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-sm md:text-base text-gray-800">{medicine.name}</h5>
                    <p className="text-xs md:text-sm text-gray-500">{medicine.brand}</p>
                  </div>
                  {medicine.requiresPrescription && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Rx</span>
                  )}
                </div>
                
                <p className="text-xs text-gray-400 mb-2">{medicine.packaging}</p>
                
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-lg md:text-xl font-bold text-gray-800">
                      ₹{medicine.discountPrice || medicine.price}
                    </div>
                    {medicine.discountPrice && (
                      <div className="text-xs text-gray-500 line-through">₹{medicine.price}</div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    medicine.stock > 50 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {medicine.stock > 50 ? 'In Stock' : 'Low Stock'}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    onAddToCart(medicine, pharmacy.name)
                    onClose()
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-xs md:text-sm flex items-center justify-center gap-1"
                >
                  <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Delivery Tracking Component with Real Map
const DeliveryTracking = ({ orderId, onClose, userLocation, pharmacyLocation }) => {
  const [deliveryStage, setDeliveryStage] = useState(2)
  const [riderLocation, setRiderLocation] = useState(pharmacyLocation)
  const [distance, setDistance] = useState(1.2)
  const [estimatedTime, setEstimatedTime] = useState(25)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  
  const stages = [
    { title: 'Order Confirmed', time: new Date(Date.now() - 15*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}), icon: CheckCircle },
    { title: 'Preparing Order', time: new Date(Date.now() - 10*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}), icon: Package },
    { title: 'Order Picked Up', time: new Date(Date.now() - 5*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}), icon: Truck },
    { title: 'On the Way', time: 'Now', icon: Navigation },
    { title: 'Delivered', time: `Expected ${new Date(Date.now() + estimatedTime*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}`, icon: Home }
  ]
  
  useEffect(() => {
    if (!window.google || !mapRef.current || !userLocation || !pharmacyLocation) return

    // Initialize map
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: riderLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    // Add user location marker
    new window.google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      },
      title: "Your Location"
    })

    // Add pharmacy marker
    new window.google.maps.Marker({
      position: pharmacyLocation,
      map: mapInstanceRef.current,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      title: "Pharmacy"
    })

    // Add rider marker (animated)
    markerRef.current = new window.google.maps.Marker({
      position: riderLocation,
      map: mapInstanceRef.current,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/truck.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      title: "Delivery Partner"
    })

    // Draw route
    const directionsService = new window.google.maps.DirectionsService()
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#10b981',
        strokeWeight: 4
      }
    })

    directionsService.route(
      {
        origin: riderLocation,
        destination: userLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result)
        }
      }
    )

    // Simulate rider movement
    const timer = setInterval(() => {
      setDeliveryStage(prev => Math.min(prev + 0.2, stages.length - 1))
      
      setRiderLocation(prev => {
        const newLat = prev.lat + (userLocation.lat - prev.lat) * 0.05
        const newLng = prev.lng + (userLocation.lng - prev.lng) * 0.05
        
        // Update marker position
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: newLat, lng: newLng })
        }
        
        return { lat: newLat, lng: newLng }
      })
      
      setDistance(prev => Math.max(0.1, prev - 0.05))
      setEstimatedTime(prev => Math.max(5, prev - 1))
    }, 3000)
    
    return () => {
      clearInterval(timer)
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
    }
  }, [userLocation, pharmacyLocation])
  
  const openLiveTracking = () => {
    const url = `https://www.google.com/maps/dir/${riderLocation.lat},${riderLocation.lng}/${userLocation.lat},${userLocation.lng}`
    window.open(url, '_blank')
  }
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="text-center flex-1">
              <h3 className="text-base md:text-lg font-bold text-gray-800">Track Order</h3>
              <p className="text-xs md:text-sm text-gray-600">Order ID: {orderId}</p>
            </div>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6 max-w-4xl">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white mb-4 md:mb-6">
          <div className="text-center">
            <div className="text-3xl md:text-5xl font-bold mb-2">{estimatedTime} min</div>
            <div className="text-sm md:text-base opacity-90">Estimated delivery time</div>
            <div className="mt-3 md:mt-4 flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                {distance.toFixed(1)} km away
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3 md:w-4 md:h-4" />
                {stages[Math.floor(deliveryStage)].title}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h4 className="text-base md:text-lg font-bold text-gray-800">Live Tracking</h4>
            <button 
              onClick={openLiveTracking}
              className="flex items-center gap-1 md:gap-2 text-green-600 hover:text-green-700 text-xs md:text-sm"
            >
              <Navigation className="w-3 h-3 md:w-4 md:h-4" />
              Open in Maps
            </button>
          </div>
          
          <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden mb-3 md:mb-4">
            <div ref={mapRef} className="w-full h-full" />
            
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 md:p-3">
              <div className="flex items-center gap-2">
                <div className="bg-green-600 text-white p-1.5 md:p-2 rounded-full animate-pulse">
                  <Truck className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="text-xs md:text-sm">
                  <div className="font-medium">Delivery Partner</div>
                  <div className="text-gray-600">On the way</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
            <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-800">Distance</div>
              <div className="text-green-600 font-bold">{distance.toFixed(1)} km</div>
            </div>
            <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-800">Time Left</div>
              <div className="text-green-600 font-bold">{estimatedTime} min</div>
            </div>
            <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-800">Status</div>
              <div className="text-green-600 font-bold">On Time</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6">Delivery Progress</h4>
          
          <div className="relative">
            <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div 
              className="absolute left-3 md:left-4 top-0 w-0.5 bg-green-500 transition-all duration-500"
              style={{ height: `${(deliveryStage / (stages.length - 1)) * 100}%` }}
            ></div>
            
            {stages.map((stage, index) => {
              const StageIcon = stage.icon
              return (
                <div key={index} className="relative flex items-start gap-3 md:gap-4 mb-6 md:mb-8 last:mb-0">
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center z-10 ${
                    index <= deliveryStage ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    <StageIcon className={`w-3 h-3 md:w-4 md:h-4 ${
                      index <= deliveryStage ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 pt-0.5 md:pt-1">
                    <div className={`font-medium text-sm md:text-base ${
                      index <= deliveryStage ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {stage.title}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">{stage.time}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">Delivery Partner</h4>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm md:text-base">Rahul Sharma</div>
              <div className="text-xs md:text-sm text-gray-500 flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 md:w-4 md:h-4" />
                +91 98765 43210
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                <span className="text-xs md:text-sm text-gray-600">4.9 (1,234 deliveries)</span>
              </div>
            </div>
            <button className="flex items-center gap-1 md:gap-2 bg-green-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-green-700 text-xs md:text-sm">
              <Phone className="w-3 h-3 md:w-4 md:h-4" />
              Call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PharmacyPage = () => {
  const [cart, setCart] = useState([])
  const [prescription, setPrescription] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortFilter, setSortFilter] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [showStoreDetail, setShowStoreDetail] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedPharmacyLocation, setSelectedPharmacyLocation] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)

  // API Integration States
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [medicineType, setMedicineType] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [searchTimeout, setSearchTimeout] = useState(null)

  const API_KEY = 'YOUR_API_KEY_HERE' // Replace with your actual API key
  const BASE_URL = 'https://beta.myupchar.com/api/medicine/search'

  const categories = [
    { id: 'all', name: 'All Medicines', count: 256 },
    { id: 'Allopath', name: 'Allopath', count: 128 },
    { id: 'Ayurveda', name: 'Ayurveda', count: 78 },
    { id: 'Homeopath', name: 'Homeopath', count: 32 },
    { id: 'Unani', name: 'Unani', count: 18 },
    { id: 'General', name: 'General', count: 45 }
  ]

  const pharmacies = [
    { 
      name: 'Apollo Pharmacy', 
      distance: '0.5 km', 
      deliveryTime: '30 mins', 
      rating: 4.8,
      coordinates: { lat: 19.0760, lng: 72.8777 },
      phone: '+912266666666',
      address: '123, Pharmacy Street, Mumbai',
      availableMedicines: [1, 2, 4, 6]
    },
    { 
      name: 'MedPlus', 
      distance: '1.2 km', 
      deliveryTime: '45 mins', 
      rating: 4.6,
      coordinates: { lat: 19.0860, lng: 72.8877 },
      phone: '+912277777777',
      address: '456, Medical Road, Mumbai',
      availableMedicines: [1, 2, 4, 5]
    },
    { 
      name: 'Wellness Forever', 
      distance: '0.8 km', 
      deliveryTime: '40 mins', 
      rating: 4.7,
      coordinates: { lat: 19.0960, lng: 72.8977 },
      phone: '+912288888888',
      address: '789, Health Lane, Mumbai',
      availableMedicines: [1, 3, 5]
    },
    { 
      name: 'Guardian', 
      distance: '1.5 km', 
      deliveryTime: '50 mins', 
      rating: 4.5,
      coordinates: { lat: 19.1060, lng: 72.9077 },
      phone: '+912299999999',
      address: '101, Wellness Avenue, Mumbai',
      availableMedicines: [3, 4, 6]
    }
  ]

  // Fetch medicines from API
  const fetchMedicines = async (page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        api_key: API_KEY,
        page: page
      })

      // Add search term if present
      if (searchTerm.trim()) {
        params.append('name', searchTerm.trim())
      }

      // Add medicine type if selected (from categories)
      if (selectedCategory !== 'all') {
        params.append('type', selectedCategory)
      }

      // Add manufacturer if present
      if (manufacturer) {
        params.append('manufacturer', manufacturer)
      }

      // Ensure at least one parameter is present
      if (!searchTerm.trim() && selectedCategory === 'all' && !manufacturer) {
        // If no parameters, don't make API call
        setMedicines([])
        setLoading(false)
        return
      }

      const response = await fetch(`${BASE_URL}?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch medicines')
      }

      const data = await response.json()
      
      // Transform API response to match your medicine structure
      const apiMedicines = data.medicines || data.data || []
      const transformedMedicines = apiMedicines.map((med, index) => ({
        id: med.id || index + 1,
        name: med.name,
        brand: med.manufacturer || med.brand || 'Generic',
        category: med.type || 'General',
        price: med.mrp || med.price || 0,
        discountPrice: med.selling_price || med.discountPrice || null,
        stock: med.stock || Math.floor(Math.random() * 100) + 20, // Fallback stock
        requiresPrescription: med.requires_prescription || false,
        form: med.form || 'Tablet',
        packaging: med.packaging || med.package_details || 'Standard packaging',
        description: med.short_description || med.description || '',
        availableIn: med.available_in || ['Apollo Pharmacy', 'MedPlus']
      }))

      setMedicines(transformedMedicines)
      setCurrentPage(data.current_page || page)
      setTotalPages(data.last_page || Math.ceil(data.total / 24))
      
    } catch (err) {
      setError(err.message)
      console.error('Error fetching medicines:', err)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1)
      fetchMedicines(1)
    }, 500)

    setSearchTimeout(timeout)

    return () => clearTimeout(timeout)
  }, [searchTerm, selectedCategory, manufacturer])

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      script.onerror = () => setMapError('Failed to load Google Maps API')
      document.head.appendChild(script)
    }

    loadGoogleMapsAPI()
  }, [])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          setUserLocation({ lat: 19.0760, lng: 72.8777 })
        }
      )
    }
  }, [])

  const addToCart = (medicine, pharmacyName = null) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === medicine.id)
      const selectedPharmacy = pharmacyName || 
        pharmacies.find(p => p.availableMedicines.includes(medicine.id))?.name || 
        'Apollo Pharmacy'
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { 
        ...medicine, 
        quantity: 1,
        selectedPharmacy
      }]
    })
  }

  const removeFromCart = (medicineId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== medicineId))
  }

  const updateQuantity = (medicineId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === medicineId) {
          const newQuantity = item.quantity + change
          if (newQuantity > 0) {
            return { ...item, quantity: newQuantity }
          }
        }
        return item
      }).filter(item => item.quantity > 0)
    )
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.discountPrice || item.price) * item.quantity, 0)
  }

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPrescription({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        date: new Date().toLocaleDateString()
      })
    }
  }

  const handleCheckout = () => {
    setShowPayment(true)
  }

  const handlePaymentSuccess = (paymentData) => {
    setShowPayment(false)
    const newOrderId = 'ORD' + Date.now().toString().slice(-8)
    setOrderId(newOrderId)
    
    // Save payment details
    const orderDetails = {
      orderId: newOrderId,
      paymentId: paymentData.paymentId,
      paymentMethod: paymentData.method,
      amount: getCartTotal(),
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.discountPrice || item.price
      }))
    }
    
    // Save to localStorage
    localStorage.setItem('lastOrder', JSON.stringify(orderDetails))
    
    const firstItem = cart[0]
    const pharmacy = pharmacies.find(p => p.name === firstItem?.selectedPharmacy)
    setSelectedPharmacyLocation(pharmacy?.coordinates || pharmacies[0].coordinates)
    
    setCart([])
    setTimeout(() => {
      setShowDelivery(true)
    }, 1000)
  }

  const openGoogleMaps = (destination) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destination.lat},${destination.lng}`
      window.open(url, '_blank')
    }
  }

  const filterOptions = [
    { id: 'default', name: 'Default' },
    { id: 'price_low_high', name: 'Price: Low to High' },
    { id: 'price_high_low', name: 'Price: High to Low' },
    { id: 'name_asc', name: 'Name: A to Z' },
    { id: 'name_desc', name: 'Name: Z to A' },
    { id: 'under_100', name: 'Under ₹100' },
    { id: 'under_500', name: 'Under ₹500' },
    { id: 'under_1000', name: 'Under ₹1000' },
    { id: 'discount', name: 'Best Discount' },
    { id: 'stock', name: 'In Stock' }
  ]

  const applyFilters = (medicines) => {
    let filtered = [...medicines]
    
    // Apply sorting and price filters
    switch (sortFilter) {
      case 'price_low_high':
        filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price))
        break
      case 'price_high_low':
        filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price))
        break
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'under_100':
        filtered = filtered.filter(medicine => (medicine.discountPrice || medicine.price) < 100)
        break
      case 'under_500':
        filtered = filtered.filter(medicine => (medicine.discountPrice || medicine.price) < 500)
        break
      case 'under_1000':
        filtered = filtered.filter(medicine => (medicine.discountPrice || medicine.price) < 1000)
        break
      case 'discount':
        filtered = filtered.filter(medicine => medicine.discountPrice)
        filtered.sort((a, b) => ((b.price - b.discountPrice) / b.price) - ((a.price - a.discountPrice) / a.price))
        break
      case 'stock':
        filtered = filtered.filter(medicine => medicine.stock > 0)
        break
    }
    
    return filtered
  }

  const filteredMedicines = applyFilters(medicines)

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchMedicines(currentPage + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-4 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-7xl">
        <div className="mb-4 md:mb-6">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center text-green-600 hover:text-green-700 bg-white px-3 py-2 md:px-4 md:py-2 rounded-full shadow text-sm md:text-base"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Back to Services
          </button>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 md:p-3 rounded-xl text-white">
                <Pill className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800">Pharmacy Network</h1>
                <p className="text-gray-600 text-sm md:text-base">Order medicines with home delivery</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-right">
                <div className="text-xs md:text-sm text-gray-500">Delivery Available in</div>
                <div className="text-lg md:text-xl font-bold text-green-600 flex items-center">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  30 minutes
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicines by name..."
                className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
              />
            </div>
            
            <label className="flex items-center justify-center gap-2 bg-white border px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-sm md:text-base">
              <Upload className="w-4 h-4 md:w-5 md:h-5" />
              Upload Prescription
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={handlePrescriptionUpload}
                className="hidden"
              />
            </label>
            
            <button 
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-green-700 text-sm md:text-base"
            >
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              Filters
            </button>
          </div>

          {prescription && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-800 text-sm md:text-base">{prescription.name}</div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {prescription.size} • Uploaded {prescription.date}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPrescription(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}

          <div className="mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Browse Categories</h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                  <span className={`ml-2 text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-4 md:p-6 border-b flex justify-between items-center">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Filter Medicines</h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              
              <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Sort By</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filterOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortFilter(option.id)
                            setShowFilters(false)
                          }}
                          className={`px-4 py-3 rounded-lg text-sm md:text-base text-left ${
                            sortFilter === option.id
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Price Range</h4>
                    <div className="space-y-2">
                      {[
                        { value: 'under_100', label: 'Under ₹100' },
                        { value: 'under_500', label: 'Under ₹500' },
                        { value: 'under_1000', label: 'Under ₹1,000' },
                        { value: 'under_2000', label: 'Under ₹2,000' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input 
                            type="radio" 
                            name="priceRange"
                            checked={sortFilter === option.value}
                            onChange={() => {
                              setSortFilter(option.value)
                              setShowFilters(false)
                            }}
                            className="text-green-600"
                          />
                          <span className="text-sm md:text-base">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 md:p-6 border-t flex gap-3">
                <button
                  onClick={() => {
                    setSortFilter('default')
                    setSelectedCategory('all')
                    setSearchTerm('')
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 md:py-3 rounded-lg hover:bg-gray-50"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-green-600 text-white py-2 md:py-3 rounded-lg hover:bg-green-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                {selectedCategory === 'all' ? 'All Medicines' : 
                  categories.find(c => c.id === selectedCategory)?.name}
                <span className="text-gray-500 text-sm md:text-base ml-2">
                  ({filteredMedicines.length} items)
                </span>
              </h2>
              {sortFilter !== 'default' && (
                <div className="text-sm text-gray-600">
                  Sorted by: {filterOptions.find(f => f.id === sortFilter)?.name}
                </div>
              )}
            </div>
            
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading medicines...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Error loading medicines</p>
                <p className="text-gray-500 text-sm">{error}</p>
                <button
                  onClick={() => fetchMedicines(1)}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && medicines.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No medicines found for "{searchTerm}"</p>
                <p className="text-gray-500 text-sm mt-2">Try searching with a different name</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  {filteredMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="p-4 md:p-6">
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                          <div>
                            <div className="flex items-center gap-1 md:gap-2 mb-1">
                              <h3 className="font-bold text-base md:text-lg text-gray-800">{medicine.name}</h3>
                              {medicine.requiresPrescription && (
                                <span className="text-xs bg-red-100 text-red-700 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                                  Rx
                                </span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500">{medicine.brand}</p>
                            <p className="text-xs text-gray-400 mt-1">{medicine.packaging}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl md:text-2xl font-bold text-gray-800">
                              ₹{medicine.discountPrice || medicine.price}
                            </div>
                            {medicine.discountPrice && (
                              <div className="text-xs md:text-sm text-gray-500 line-through">
                                ₹{medicine.price}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">{medicine.description}</p>

                        <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                          <span className="flex items-center gap-1">
                            <Pill className="w-3 h-3 md:w-4 md:h-4" />
                            {medicine.form}
                          </span>
                          <span className={`flex items-center gap-1 ${
                            medicine.stock > 50 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {medicine.stock > 50 ? 'In Stock' : 'Low Stock'}
                          </span>
                        </div>

                        <div className="mb-3 md:mb-4">
                          <div className="text-xs md:text-sm text-gray-600 mb-1">Available at:</div>
                          <div className="flex flex-wrap gap-1">
                            {medicine.availableIn.slice(0, 2).map((pharmacy, idx) => (
                              <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                {pharmacy}
                              </span>
                            ))}
                            {medicine.availableIn.length > 2 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                +{medicine.availableIn.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedMedicine(medicine)}
                            className="flex-1 border border-green-600 text-green-600 py-2 md:py-3 rounded-lg hover:bg-green-50 transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
                          >
                            <Info className="w-4 h-4 md:w-5 md:h-5" />
                            View Details
                          </button>
                          <button
                            onClick={() => addToCart(medicine)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 md:py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
                          >
                            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {currentPage < totalPages && (
                  <div className="text-center mb-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-white border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load More Medicines'}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-green-600" />
                Nearby Pharmacies
              </h3>
              
              <div className="mb-6">
                <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden mb-3 md:mb-4">
                  {mapError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="text-gray-600">Failed to load map</p>
                        <p className="text-sm text-gray-500 mt-2">{mapError}</p>
                      </div>
                    </div>
                  ) : !mapLoaded ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-2 animate-spin" />
                        <p className="text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  ) : userLocation ? (
                    <PharmacyMap 
                      pharmacies={pharmacies}
                      userLocation={userLocation}
                      onPharmacySelect={(pharmacy) => {
                        setSelectedStore(pharmacy)
                        setShowStoreDetail(true)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Waiting for location...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/pharmacy+near+me/@${userLocation?.lat || 19.0760},${userLocation?.lng || 72.8777},14z`, '_blank')}
                  className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Navigation className="w-4 h-4 md:w-5 md:h-5" />
                  View More Pharmacies on Google Maps
                </button>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {pharmacies.map((pharmacy, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <div className="mb-3 sm:mb-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">{pharmacy.name}</h4>
                        <span className="sm:hidden bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          {pharmacy.availableMedicines.length} medicines
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          {pharmacy.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                          {pharmacy.deliveryTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                          {pharmacy.rating}
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          <Package className="w-3 h-3" />
                          {pharmacy.availableMedicines.length} items
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{pharmacy.address}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openGoogleMaps(pharmacy.coordinates)}
                        className="flex-1 sm:flex-none border border-green-600 text-green-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-green-50 text-xs md:text-sm flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3 h-3 md:w-4 md:h-4" />
                        Direction
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedStore(pharmacy)
                          setShowStoreDetail(true)
                        }}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-green-700 text-xs md:text-sm flex items-center justify-center gap-1"
                      >
                        <Pill className="w-3 h-3 md:w-4 md:h-4" />
                        View Store
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-96">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg sticky top-4 md:top-8">
              <div className="p-4 md:p-6 border-b">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  Your Cart
                  {cart.length > 0 && (
                    <span className="ml-2 bg-green-100 text-green-700 text-xs md:text-sm px-2 py-0.5 md:py-1 rounded-full">
                      {cart.length} items
                    </span>
                  )}
                </h3>
              </div>

              <div className="p-4 md:p-6 max-h-[400px] md:max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-6 md:py-8 text-gray-500">
                    <ShoppingCart className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" />
                    <p className="text-sm md:text-base">Your cart is empty</p>
                    <p className="text-xs md:text-sm mt-1">Add medicines to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-800 text-sm md:text-base">{item.name}</h4>
                              {item.requiresPrescription && (
                                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Rx</span>
                              )}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500">{item.brand}</div>
                            <div className="text-xs text-gray-400">{item.packaging}</div>
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <Pill className="w-3 h-3" />
                              {item.selectedPharmacy}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 ml-2 p-1"
                          >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-800">
                              ₹{(item.discountPrice || item.price) * item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                            >
                              <Minus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <span className="w-6 md:w-8 text-center font-medium text-sm md:text-base">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                            >
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 md:p-6 border-t">
                  <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                    <div className="flex justify-between text-gray-600 text-sm md:text-base">
                      <span>Subtotal</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm md:text-base">
                      <span>Delivery</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 md:pt-3 border-t text-sm md:text-base">
                      <span>Total</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 md:py-4 rounded-lg hover:shadow-lg transition-all font-bold text-sm md:text-base"
                  >
                    Proceed to Checkout
                  </button>

                  <div className="mt-3 md:mt-4 flex items-center justify-center text-xs md:text-sm text-gray-500">
                    <Shield className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                    Secure payment • 100% Genuine medicines
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="mt-4 md:mt-6 bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
              <h4 className="font-bold text-gray-800 mb-3 md:mb-4 flex items-center text-sm md:text-base">
                <Truck className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-600" />
                Delivery Information
              </h4>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Standard Delivery</span>
                  <span className="font-medium">30-45 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Express Delivery</span>
                  <span className="font-medium">15-20 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Minimum Order</span>
                  <span className="font-medium">₹199</span>
                </div>
                <div className="pt-2 md:pt-3 border-t">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Free delivery on orders above ₹499
                  </div>
                </div>
              </div>
              
              {orderId && (
                <div className="mt-4 pt-3 border-t">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-800 mb-1">Order #{orderId}</div>
                    <div className="text-xs text-green-600 mb-2">Ready for delivery</div>
                    <button
                      onClick={() => setShowDelivery(true)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Track Delivery
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Detail Modal */}
      {selectedMedicine && (
        <MedicineDetailModal
          medicine={selectedMedicine}
          onClose={() => setSelectedMedicine(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Store Detail View */}
      {showStoreDetail && selectedStore && (
        <StoreDetailView
          pharmacy={selectedStore}
          medicines={medicines}
          userLocation={userLocation}
          onClose={() => setShowStoreDetail(false)}
          onAddToCart={addToCart}
        />
      )}

      {/* Payment Gateway */}
      {showPayment && (
        <PaymentGateway
          amount={getCartTotal()}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
          orderDetails={{
            description: 'Medicine Purchase',
            customerName: 'Customer Name', // Get from your auth system
            customerEmail: 'customer@example.com', // Get from your auth system
            customerPhone: '9999999999', // Get from your auth system
            notes: {
              address: 'Customer Address', // Get from your address system
              items: cart.length
            }
          }}
          businessName="MedCare Pharmacy"
          businessLogo="https://your-logo-url.com/logo.png"
          paymentMethods={['razorpay', 'cod']} // Enable both payment methods
        />
      )}

      {/* Delivery Tracking */}
      {showDelivery && orderId && userLocation && selectedPharmacyLocation && mapLoaded && (
        <DeliveryTracking 
          orderId={orderId}
          onClose={() => setShowDelivery(false)}
          userLocation={userLocation}
          pharmacyLocation={selectedPharmacyLocation}
        />
      )}
    </div>
  )
}

export default PharmacyPage