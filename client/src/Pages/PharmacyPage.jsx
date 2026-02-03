import React, { useState, useEffect } from 'react'
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
  Check,
  Loader2
} from 'lucide-react'

// Razorpay Payment Gateway Integration
const PaymentGateway = ({ amount, onSuccess, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('razorpay')
  
  const handlePayment = async () => {
    setIsProcessing(true)
    
    if (selectedMethod === 'razorpay') {
      // Razorpay Integration
      const options = {
        key: 'rzp_test_YOUR_KEY_ID', // Replace with your Razorpay key
        amount: amount * 100, // Razorpay accepts amount in paise
        currency: 'INR',
        name: 'MedCare Pharmacy',
        description: 'Medicine Purchase',
        image: 'https://your-logo-url.com/logo.png',
        handler: function (response) {
          setIsProcessing(false)
          onSuccess(response.razorpay_payment_id)
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#10b981'
        }
      }
      
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        setIsProcessing(false)
        alert('Payment failed! Please try again.')
      })
      rzp.open()
    } else {
      // Simulate COD
      setTimeout(() => {
        setIsProcessing(false)
        onSuccess('COD')
      }, 2000)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-4 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">Complete Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
        
        <div className="mb-4 md:mb-6">
          <div className="text-center mb-4 md:mb-6">
            <div className="text-2xl md:text-3xl font-bold text-gray-800">₹{amount}</div>
            <div className="text-sm md:text-base text-gray-500">Total Amount</div>
          </div>
          
          <div className="space-y-3">
            <div className="border rounded-lg p-3 md:p-4">
              <h4 className="font-semibold mb-3 text-sm md:text-base">Payment Methods</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 md:p-3 hover:bg-gray-50 rounded cursor-pointer border">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="razorpay"
                    checked={selectedMethod === 'razorpay'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="text-green-600" 
                  />
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <span className="flex-1 text-sm md:text-base">UPI / Cards / Net Banking</span>
                </label>
                <label className="flex items-center gap-3 p-2 md:p-3 hover:bg-gray-50 rounded cursor-pointer border">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod"
                    checked={selectedMethod === 'cod'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="text-green-600" 
                  />
                  <div className="w-4 h-4 md:w-5 md:h-5 text-lg">💵</div>
                  <span className="flex-1 text-sm md:text-base">Cash on Delivery</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 md:py-4 rounded-lg hover:shadow-lg transition-all font-bold disabled:opacity-70 text-sm md:text-base"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
              Processing...
            </span>
          ) : (
            selectedMethod === 'cod' ? 'Place Order' : `Pay ₹${amount}`
          )}
        </button>
        
        <div className="mt-3 md:mt-4 text-center text-xs md:text-sm text-gray-500">
          <Shield className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
          Secure payment • 100% Genuine medicines
        </div>
      </div>
    </div>
  )
}

// Store Detail View Component
const StoreDetailView = ({ pharmacy, medicines, onClose, onAddToCart }) => {
  const availableMeds = medicines.filter(med => pharmacy.availableMedicines.includes(med.id))
  
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

// Delivery Tracking Component
const DeliveryTracking = ({ orderId, onClose, userLocation, pharmacyLocation }) => {
  const [deliveryStage, setDeliveryStage] = useState(2)
  const [riderLocation, setRiderLocation] = useState(pharmacyLocation)
  const [distance, setDistance] = useState(1.2)
  const [estimatedTime, setEstimatedTime] = useState(25)
  
  const stages = [
    { title: 'Order Confirmed', time: new Date(Date.now() - 15*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}), icon: CheckCircle },
    { title: 'Preparing Order', time: new Date(Date.now() - 10*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}), icon: Package },
    { title: 'Order Picked Up', time: new Date(Date.now() - 5*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'}), icon: Truck },
    { title: 'On the Way', time: 'Now', icon: Navigation },
    { title: 'Delivered', time: `Expected ${new Date(Date.now() + estimatedTime*60000).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}`, icon: Home }
  ]
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDeliveryStage(prev => Math.min(prev + 0.2, stages.length - 1))
      
      setRiderLocation(prev => {
        const newLat = prev.lat + (userLocation.lat - prev.lat) * 0.05
        const newLng = prev.lng + (userLocation.lng - prev.lng) * 0.05
        return { lat: newLat, lng: newLng }
      })
      
      setDistance(prev => Math.max(0.1, prev - 0.05))
      setEstimatedTime(prev => Math.max(5, prev - 1))
    }, 3000)
    
    return () => clearInterval(timer)
  }, [userLocation])
  
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
            {userLocation && riderLocation && (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${riderLocation.lat},${riderLocation.lng}&destination=${userLocation.lat},${userLocation.lng}&mode=driving`}
                allowFullScreen
                title="Delivery Route"
              />
            )}
            
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
  const [userLocation, setUserLocation] = useState(null)
  const [selectedPharmacyLocation, setSelectedPharmacyLocation] = useState(null)
  const [orderId, setOrderId] = useState(null)

  const categories = [
    { id: 'all', name: 'All Medicines', count: 256 },
    { id: 'prescription', name: 'Prescription', count: 128 },
    { id: 'otc', name: 'Over-the-Counter', count: 78 },
    { id: 'ayurvedic', name: 'Ayurvedic', count: 32 },
    { id: 'wellness', name: 'Wellness', count: 18 }
  ]

  const medicines = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      brand: 'Crocin',
      category: 'otc',
      price: 45,
      discountPrice: 35,
      stock: 120,
      requiresPrescription: false,
      form: 'Tablet',
      packaging: 'Strip of 15 tablets',
      description: 'For relief from fever and mild to moderate pain',
      availableIn: ['Apollo Pharmacy', 'MedPlus', 'Wellness Forever']
    },
    {
      id: 2,
      name: 'Amoxicillin 250mg',
      brand: 'Mox',
      category: 'prescription',
      price: 120,
      discountPrice: 95,
      stock: 45,
      requiresPrescription: true,
      form: 'Capsule',
      packaging: 'Strip of 10 capsules',
      description: 'Antibiotic for bacterial infections',
      availableIn: ['Apollo Pharmacy', 'MedPlus']
    },
    {
      id: 3,
      name: 'Vitamin D3 1000IU',
      brand: 'Carbamide Forte',
      category: 'wellness',
      price: 250,
      discountPrice: 199,
      stock: 80,
      requiresPrescription: false,
      form: 'Softgel',
      packaging: 'Bottle of 60 softgels',
      description: 'Vitamin D supplement for bone health',
      availableIn: ['Wellness Forever', 'Guardian']
    },
    {
      id: 4,
      name: 'Aspirin 75mg',
      brand: 'Ecosprin',
      category: 'prescription',
      price: 35,
      discountPrice: 28,
      stock: 200,
      requiresPrescription: true,
      form: 'Tablet',
      packaging: 'Strip of 14 tablets',
      description: 'Blood thinner for heart conditions',
      availableIn: ['Apollo Pharmacy', 'MedPlus', 'Guardian']
    },
    {
      id: 5,
      name: 'Cetirizine 10mg',
      brand: 'Zyrtec',
      category: 'otc',
      price: 65,
      discountPrice: 52,
      stock: 150,
      requiresPrescription: false,
      form: 'Tablet',
      packaging: 'Strip of 10 tablets',
      description: 'Antihistamine for allergy relief',
      availableIn: ['MedPlus', 'Wellness Forever']
    },
    {
      id: 6,
      name: 'Ashwagandha 500mg',
      brand: 'Himalaya',
      category: 'ayurvedic',
      price: 180,
      discountPrice: 144,
      stock: 60,
      requiresPrescription: false,
      form: 'Tablet',
      packaging: 'Bottle of 60 tablets',
      description: 'Ayurvedic herb for stress relief',
      availableIn: ['Apollo Pharmacy', 'Guardian']
    }
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

  const handlePaymentSuccess = (paymentId) => {
    setShowPayment(false)
    const newOrderId = 'ORD' + Date.now().toString().slice(-8)
    setOrderId(newOrderId)
    
    const firstItem = cart[0]
    const pharmacy = pharmacies.find(p => p.name === firstItem.selectedPharmacy)
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
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(medicine => medicine.category === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brand.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
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
                placeholder="Search medicines, brands, or symptoms..."
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

                    <button
                      onClick={() => addToCart(medicine)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 md:py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
                    >
                      <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-green-600" />
                Nearby Pharmacies
              </h3>
              
              <div className="mb-6">
                <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden mb-3 md:mb-4">
                  {userLocation ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=pharmacy+near+${userLocation.lat},${userLocation.lng}&zoom=14`}
                      allowFullScreen
                      title="Nearby Pharmacies"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Loading map...</p>
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
                    <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 md:pt-3 border-t text-sm md:text-base">
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

      {/* Store Detail View */}
      {showStoreDetail && selectedStore && (
        <StoreDetailView
          pharmacy={selectedStore}
          medicines={medicines}
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
        />
      )}

      {/* Delivery Tracking */}
      {showDelivery && orderId && userLocation && selectedPharmacyLocation && (
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