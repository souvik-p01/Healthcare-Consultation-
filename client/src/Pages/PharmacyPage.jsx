import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Download,
  Plus,
  Minus,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const PharmacyPage = () => {
  const [cart, setCart] = useState([])
  const [prescription, setPrescription] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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
      description: 'For relief from fever and mild to moderate pain'
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
      description: 'Antibiotic for bacterial infections'
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
      description: 'Vitamin D supplement for bone health'
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
      description: 'Blood thinner for heart conditions'
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
      description: 'Antihistamine for allergy relief'
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
      description: 'Ayurvedic herb for stress relief'
    }
  ]

  const pharmacies = [
    { name: 'Apollo Pharmacy', distance: '0.5 km', deliveryTime: '30 mins', rating: 4.8 },
    { name: 'MedPlus', distance: '1.2 km', deliveryTime: '45 mins', rating: 4.6 },
    { name: 'Wellness Forever', distance: '0.8 km', deliveryTime: '40 mins', rating: 4.7 },
    { name: 'Guardian', distance: '1.5 km', deliveryTime: '50 mins', rating: 4.5 }
  ]

  const addToCart = (medicine) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === medicine.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...medicine, quantity: 1 }]
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
          return newQuantity > 0
            ? { ...item, quantity: newQuantity }
            : item
        }
        return item
      })
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

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link 
          to="/services"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 bg-white px-4 py-2 rounded-full shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl text-white">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Pharmacy Network</h1>
                <p className="text-gray-600">Order medicines with home delivery</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Delivery Available in</div>
                <div className="text-xl font-bold text-green-600 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  30 minutes
                </div>
              </div>
            </div>
          </div>

          {/* Search and Prescription Upload */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicines, brands, or symptoms..."
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <label className="flex items-center gap-2 bg-white border px-6 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Upload className="w-5 h-5" />
              Upload Prescription
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={handlePrescriptionUpload}
                className="hidden"
              />
            </label>
            
            <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {prescription && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-800">{prescription.name}</div>
                  <div className="text-sm text-gray-600">
                    {prescription.size} • Uploaded {prescription.date}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPrescription(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Browse Categories</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {category.name}
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Medicines Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-800">{medicine.name}</h3>
                          {medicine.requiresPrescription && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{medicine.brand}</p>
                        <p className="text-xs text-gray-400 mt-1">{medicine.packaging}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          ₹{medicine.discountPrice || medicine.price}
                        </div>
                        {medicine.discountPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            ₹{medicine.price}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{medicine.description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Pill className="w-4 h-4" />
                        {medicine.form}
                      </span>
                      <span className={`flex items-center gap-1 ${
                        medicine.stock > 50 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {medicine.stock > 50 ? 'In Stock' : 'Low Stock'}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(medicine)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Nearby Pharmacies */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-green-600" />
                Nearby Pharmacies
              </h3>
              <div className="space-y-4">
                {pharmacies.map((pharmacy, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50"
                  >
                    <div>
                      <h4 className="font-bold text-gray-800">{pharmacy.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pharmacy.distance} away
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {pharmacy.deliveryTime} delivery
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          {pharmacy.rating}
                        </span>
                      </div>
                    </div>
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                      View Store
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl shadow-lg sticky top-8">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-3" />
                  Your Cart
                  {cart.length > 0 && (
                    <span className="ml-2 bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                      {cart.length} items
                    </span>
                  )}
                </h3>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Your cart is empty</p>
                    <p className="text-sm mt-1">Add medicines to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-lg font-bold text-gray-800">
                              ₹{(item.discountPrice || item.price) * item.quantity}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-800 pt-3 border-t">
                      <span>Total</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg hover:shadow-lg transition-all font-bold">
                    Proceed to Checkout
                  </button>

                  <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                    <Shield className="w-4 h-4 mr-2" />
                    Secure payment • 100% Genuine medicines
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-green-600" />
                Delivery Information
              </h4>
              <div className="space-y-3 text-sm text-gray-600">
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
                <div className="pt-3 border-t">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Free delivery on orders above ₹499
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PharmacyPage