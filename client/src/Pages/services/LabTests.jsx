import React, { useState } from 'react';
import { 
  Microscope,
  Home,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Shield,
  Zap,
  FileText,
  Download,
  Heart,
  Activity,
  Droplet,
  TestTube,
  ChevronRight,
  X,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  CreditCard,
  Plus,
  Minus,
  Star,
  Award,
  Truck,
  Shield as ShieldIcon,
  FileCheck,
  Bell,
  Share2,
  Printer,
  Bookmark,
  Thermometer,
  Brain,
  Eye,
  Bone,
  ShoppingCart
} from 'lucide-react';

const LabTests = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTestDetailModal, setShowTestDetailModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    pincode: ''
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const testPackages = [
    {
      id: 1,
      name: 'Basic Health Checkup',
      icon: <Heart className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      tests: 45,
      price: 999,
      originalPrice: 1499,
      discount: '33% OFF',
      popular: true,
      includes: [
        'Complete Blood Count (CBC)',
        'Lipid Profile (Cholesterol)',
        'Blood Sugar Fasting & PP',
        'Liver Function Test (LFT)',
        'Kidney Function Test (KFT)',
        'Thyroid Stimulating Hormone (TSH)',
        'Complete Urine Examination',
        'ECG'
      ],
      recommendedFor: ['General health screening', 'Pre-employment checkup', 'Annual health check'],
      reportTime: '24-48 hours',
      color: 'from-blue-500 to-cyan-600',
      category: 'comprehensive'
    },
    {
      id: 2,
      name: 'Comprehensive Package',
      icon: <Activity className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
            <Award className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      tests: 85,
      price: 2499,
      originalPrice: 3999,
      discount: '38% OFF',
      popular: true,
      includes: [
        'All Basic Health Checkup tests',
        'Vitamin D & B12 Levels',
        'HbA1c (3-month diabetes control)',
        'Cardiac Risk Markers',
        'Cancer Screening Markers',
        'Hormonal Profile',
        'Bone Health Tests',
        'Complete Iron Studies'
      ],
      recommendedFor: ['Complete body checkup', 'Post-recovery monitoring', 'Comprehensive diagnosis'],
      reportTime: '48-72 hours',
      color: 'from-purple-500 to-indigo-600',
      category: 'comprehensive'
    },
    {
      id: 3,
      name: 'Senior Citizen Care',
      icon: <Shield className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <ShieldIcon className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      tests: 72,
      price: 1999,
      originalPrice: 2999,
      discount: '33% OFF',
      popular: false,
      includes: [
        'Geriatric Health Panel',
        'Bone Density (DEXA Scan optional)',
        'Prostate Health (PSA)',
        'Cardiac Risk Assessment',
        'Diabetes Management Panel',
        'Kidney & Liver Comprehensive',
        'Vitamin Deficiency Panel',
        'Memory & Cognitive Tests'
      ],
      recommendedFor: ['Age 60+ health monitoring', 'Chronic disease management', 'Regular senior checkups'],
      reportTime: '24-48 hours',
      color: 'from-green-500 to-emerald-600',
      category: 'specialized'
    },
    {
      id: 4,
      name: 'Women Wellness',
      icon: <Droplet className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Droplet className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      tests: 60,
      price: 1799,
      originalPrice: 2499,
      discount: '28% OFF',
      popular: false,
      includes: [
        'Hormonal Profile Complete',
        'Thyroid Function Tests',
        'Anemia Panel with Iron Studies',
        'Bone Health Markers',
        'Breast Cancer Markers (CA 15.3)',
        'PCOS Screening',
        'Ovarian Function Tests',
        'Pregnancy Planning Tests'
      ],
      recommendedFor: ['Women health screening', 'PCOS diagnosis', 'Pregnancy planning', 'Menopause management'],
      reportTime: '24-48 hours',
      color: 'from-pink-500 to-rose-600',
      category: 'specialized'
    },
    {
      id: 5,
      name: 'Diabetes Care',
      icon: <Thermometer className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Thermometer className="w-8 h-8 text-white" />
          </div>
        </div>
      ),
      tests: 35,
      price: 1299,
      originalPrice: 1899,
      discount: '32% OFF',
      popular: false,
      includes: [
        'HbA1c (Glycated Hemoglobin)',
        'Fasting & Postprandial Glucose',
        'Insulin Levels',
        'C-Peptide Test',
        'Kidney Function for Diabetics',
        'Lipid Profile',
        'Liver Function Tests'
      ],
      recommendedFor: ['Diabetes monitoring', 'Pre-diabetes screening', 'Diabetes management'],
      reportTime: '24 hours',
      color: 'from-orange-500 to-red-600',
      category: 'specialized'
    }
  ];

  const individualTests = [
    { id: 101, name: 'Complete Blood Count (CBC)', price: 299, category: 'blood' },
    { id: 102, name: 'Lipid Profile', price: 499, category: 'blood' },
    { id: 103, name: 'Liver Function Test', price: 599, category: 'blood' },
    { id: 104, name: 'Thyroid Profile', price: 699, category: 'blood' },
    { id: 105, name: 'Vitamin D Total', price: 899, category: 'blood' },
    { id: 106, name: 'HbA1c', price: 399, category: 'blood' },
    { id: 107, name: 'Urine Routine', price: 199, category: 'urine' },
    { id: 108, name: 'ECG', price: 399, category: 'imaging' },
    { id: 109, name: 'X-Ray Chest', price: 499, category: 'imaging' },
    { id: 110, name: 'Ultrasound Abdomen', price: 899, category: 'imaging' }
  ];

  const categories = [
    { id: 'all', label: 'All Tests', icon: <TestTube className="w-5 h-5" />, count: 150 },
    { id: 'blood', label: 'Blood Tests', icon: <Droplet className="w-5 h-5" />, count: 85 },
    { id: 'urine', label: 'Urine Tests', icon: <TestTube className="w-5 h-5" />, count: 25 },
    { id: 'imaging', label: 'Imaging', icon: <Activity className="w-5 h-5" />, count: 30 },
    { id: 'cardiac', label: 'Cardiac', icon: <Heart className="w-5 h-5" />, count: 10 }
  ];

  const features = [
    {
      id: 'home-collection',
      icon: <Home className="w-8 h-8" />,
      title: 'Home Sample Collection',
      desc: 'Free sample collection from your doorstep by certified professionals',
      details: {
        process: [
          'Book test online',
          'Select time slot',
          'Expert phlebotomist visits',
          'Safe sample collection',
          'Samples transported in temperature-controlled kits'
        ],
        benefits: [
          'No travel required',
          'Safe & hygienic',
          'Morning slots available',
          'Trained professionals'
        ],
        coverage: 'Available in 50+ cities'
      }
    },
    {
      id: 'nabl-certified',
      icon: <Shield className="w-8 h-8" />,
      title: 'NABL Certified Labs',
      desc: 'Reports from certified and trusted labs with quality assurance',
      details: {
        certifications: ['NABL', 'ISO 15189', 'CAP Accredited'],
        quality: [
          'Regular quality audits',
          'Automated testing equipment',
          'Trained technicians',
          'Double verification process'
        ],
        accuracy: '99.8% test accuracy rate'
      }
    },
    {
      id: 'fast-results',
      icon: <Clock className="w-8 h-8" />,
      title: 'Fast Results',
      desc: 'Get reports within 24-48 hours with priority processing',
      details: {
        timelines: [
          'Routine tests: 24 hours',
          'Special tests: 48-72 hours',
          'Emergency tests: 6-12 hours',
          'Cultures: 5-7 days'
        ],
        notifications: [
          'SMS when sample collected',
          'Email when processing',
          'SMS when report ready',
          'WhatsApp reports available'
        ]
      }
    },
    {
      id: 'digital-reports',
      icon: <Download className="w-8 h-8" />,
      title: 'Digital Reports',
      desc: 'Access reports online anytime with lifetime storage',
      details: {
        features: [
          'Download PDF reports',
          'Share with doctors',
          'Compare historical reports',
          'AI-powered insights',
          'Health trends analysis'
        ],
        security: [
          'Encrypted storage',
          'Patient privacy protected',
          'HIPAA compliant',
          'Two-factor authentication'
        ]
      }
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Select Test',
      desc: 'Choose from 1000+ tests & packages',
      icon: <FileText className="w-6 h-6" />,
      tech: 'Smart Test Recommender'
    },
    {
      step: 2,
      title: 'Book Slot',
      desc: 'Pick convenient time for collection',
      icon: <Calendar className="w-6 h-6" />,
      tech: 'Real-time Slot Management'
    },
    {
      step: 3,
      title: 'Sample Collection',
      desc: 'Expert phlebotomist visits your home',
      icon: <Home className="w-6 h-6" />,
      tech: 'GPS Tracking & Verification'
    },
    {
      step: 4,
      title: 'Get Reports',
      desc: 'Digital reports with AI insights',
      icon: <Download className="w-6 h-6" />,
      tech: 'AI-Powered Analytics'
    }
  ];

  const timeSlots = [
    '6:00 AM - 8:00 AM',
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM'
  ];

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setShowBookingModal(true);
    setBookingStep(1);
  };

  const handleAddToCart = (test) => {
    if (!cart.find(item => item.id === test.id)) {
      setCart([...cart, { ...test, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (testId) => {
    setCart(cart.filter(item => item.id !== testId));
  };

  const handleBooking = () => {
    const totalAmount = selectedPackage ? selectedPackage.price : 
      cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    alert(`✅ Booking Confirmed!\n\nAmount: ₹${totalAmount}\nPatient: ${patientDetails.name}\nTime: ${selectedSlot}\n\nConfirmation sent to ${patientDetails.phone}`);
    
    setShowBookingModal(false);
    setBookingStep(1);
    setPatientDetails({
      name: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      pincode: ''
    });
    setSelectedSlot('');
    setCart([]);
    setSelectedPackage(null);
  };

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
  };

  const updateQuantity = (testId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(testId);
      return;
    }
    setCart(cart.map(item => 
      item.id === testId ? { ...item, quantity: newQuantity } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 text-white py-8 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-4 md:mb-6 hover:text-purple-100 transition-colors text-sm md:text-base bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
            <div className="mb-4 md:mb-0 md:mr-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Microscope className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2">
                Lab Tests at Home
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl">
                Book lab tests online with free home sample collection. Get accurate reports from NABL certified labs delivered digitally.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests, packages, or symptoms..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className="bg-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
            >
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-base md:text-lg">{feature.title}</h3>
              <p className="text-xs md:text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Cart Preview */}
        {cart.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-4 sticky top-4 z-10 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Your Cart</h3>
                  <p className="text-sm text-gray-600">{cart.length} item{cart.length > 1 ? 's' : ''} selected</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-purple-600 text-lg">
                  ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                </span>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Book Now
                </button>
              </div>
            </div>
            
            {/* Cart Items */}
            <div className="mt-4 border-t pt-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between mb-2 last:mb-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-purple-600">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Packages */}
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">
              Popular Health Packages
            </h2>
            <div className="text-sm text-gray-600">
              Showing {testPackages.length} packages
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {testPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    {pkg.logo}
                    {pkg.popular && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                        POPULAR
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-2 relative z-10">{pkg.name}</h3>
                  <div className="flex items-center text-sm mb-3 relative z-10">
                    <Package className="w-4 h-4 mr-2" />
                    {pkg.tests} Tests Included
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl md:text-4xl font-bold">₹{pkg.price}</span>
                      <span className="text-sm ml-3 line-through opacity-70">₹{pkg.originalPrice}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                        {pkg.discount} OFF
                      </span>
                      <span className="text-sm">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Reports in {pkg.reportTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Includes:</h4>
                    <div className="space-y-2">
                      {pkg.includes.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex items-start text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                      {pkg.includes.length > 4 && (
                        <div className="text-purple-600 text-sm font-medium">
                          +{pkg.includes.length - 4} more tests
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePackageSelect(pkg)}
                      className={`flex-1 bg-gradient-to-r ${pkg.color} text-white py-3.5 rounded-xl font-bold hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3`}
                    >
                      Book Now
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddToCart(pkg)}
                      className="px-4 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors flex items-center justify-center"
                      title="Add to cart"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Tests */}
        <div id="individual-tests" className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">
              Individual Tests
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full ml-1">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {individualTests
              .filter(test => selectedCategory === 'all' || test.category === selectedCategory)
              .map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">{test.name}</h3>
                      <div className="flex items-center mt-1">
                        <TestTube className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500 capitalize">{test.category} Test</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-purple-600">₹{test.price}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(test)}
                      className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPackage({ ...test, name: test.name, price: test.price });
                        setShowBookingModal(true);
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative text-center group">
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
                  <div className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {item.tech}
                  </div>
                </div>
                
                {idx < howItWorks.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-8 right-0 w-6 h-6 text-gray-300 transform -translate-y-1/2 translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-4xl font-bold mb-4">
              Get Your Tests Done Today
            </h3>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Book now and get free home sample collection with reports in 24-48 hours
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (cart.length > 0 || selectedPackage) {
                    setShowBookingModal(true);
                  } else {
                    alert('Please select a test or package first');
                  }
                }}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 active:scale-95"
              >
                Book Lab Test
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  // Scroll to individual tests
                  document.getElementById('individual-tests')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-purple-600 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                View All Tests
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Book Lab Test
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Complete your booking in 3 simple steps
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Progress Steps */}
              <div className="flex justify-between mb-8 relative">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step === bookingStep
                        ? 'bg-purple-600 text-white'
                        : step < bookingStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    <span className="text-sm mt-2 font-medium">
                      {step === 1 ? 'Details' : step === 2 ? 'Schedule' : 'Payment'}
                    </span>
                  </div>
                ))}
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${((bookingStep - 1) / 2) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Booking Step 1: Patient Details */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Patient Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={patientDetails.name}
                        onChange={(e) => setPatientDetails({...patientDetails, name: e.target.value})}
                        placeholder="Enter patient's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age *
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={patientDetails.age}
                        onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})}
                        placeholder="Enter age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={patientDetails.gender}
                        onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={patientDetails.phone}
                        onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={patientDetails.email}
                        onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={patientDetails.pincode}
                        onChange={(e) => setPatientDetails({...patientDetails, pincode: e.target.value})}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Address *
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="3"
                      value={patientDetails.address}
                      onChange={(e) => setPatientDetails({...patientDetails, address: e.target.value})}
                      placeholder="Enter complete address"
                    />
                  </div>
                </div>
              )}

              {/* Booking Step 2: Schedule */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Schedule Appointment</h3>
                  
                  <div className="bg-purple-50 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">
                          {selectedPackage?.name || 'Selected Tests'}
                        </h4>
                        <p className="text-gray-600">
                          {selectedPackage?.tests ? `${selectedPackage.tests} tests included` : 
                           cart.length > 0 ? `${cart.length} test${cart.length > 1 ? 's' : ''} selected` : 
                           'No tests selected'}
                        </p>
                        <p className="text-purple-600 font-bold text-xl mt-2">
                          ₹{selectedPackage?.price || 
                            cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Select Time Slot</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {timeSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedSlot === slot
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-purple-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-semibold">Today</span>
                          </div>
                          <div className="mt-2 font-medium">{slot}</div>
                          <div className="text-sm text-green-600 mt-1">
                            ✓ Available
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Step 3: Review & Payment */}
              {bookingStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Review & Payment</h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Test Package:</span>
                      <span className="font-semibold">{selectedPackage?.name || 'Custom Selection'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Patient:</span>
                      <span className="font-semibold">{patientDetails.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Collection Time:</span>
                      <span className="font-semibold">{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Home Collection:</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-purple-600">
                          ₹{selectedPackage?.price || 
                            cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          • Our phlebotomist will call you before visiting<br/>
                          • Please keep 8-12 hours fasting for accurate results<br/>
                          • Reports will be available in your account within 24-48 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {bookingStep > 1 && (
                  <button
                    onClick={() => setBookingStep(bookingStep - 1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (bookingStep < 3) {
                      if (bookingStep === 1 && (!patientDetails.name || !patientDetails.phone)) {
                        alert('Please fill all required fields');
                        return;
                      }
                      if (bookingStep === 2 && !selectedSlot) {
                        alert('Please select a time slot');
                        return;
                      }
                      setBookingStep(bookingStep + 1);
                    } else {
                      handleBooking();
                    }
                  }}
                  className={`ml-auto px-8 py-3 rounded-lg font-bold text-white ${
                    bookingStep === 3
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } transition-colors`}
                >
                  {bookingStep === 3 ? 'Confirm & Pay Now' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  {selectedFeature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedFeature.title}</h3>
                  <p className="text-gray-600">{selectedFeature.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {selectedFeature.id === 'home-collection' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">Collection Process</h4>
                    <ul className="space-y-2">
                      {selectedFeature.details.process.map((step, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h5 className="font-bold text-gray-800 mb-2">Benefits</h5>
                      <ul className="space-y-2">
                        {selectedFeature.details.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-4">
                      <h5 className="font-bold text-gray-800 mb-2">Coverage</h5>
                      <p className="text-lg font-bold text-green-600 mb-2">
                        {selectedFeature.details.coverage}
                      </p>
                      <p className="text-sm text-gray-600">
                        Services available across India with certified phlebotomists
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedFeature.id === 'nabl-certified' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">Certifications & Accreditations</h4>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {selectedFeature.details.certifications.map((cert, idx) => (
                        <span key={idx} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>
                    <p className="text-3xl font-bold text-green-600 text-center my-8">
                      {selectedFeature.details.accuracy} Accuracy Rate
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-bold text-gray-800 mb-3">Quality Assurance</h5>
                    <ul className="space-y-2">
                      {selectedFeature.details.quality.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <ShieldIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedFeature.id === 'fast-results' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">Report Timelines</h4>
                    <div className="space-y-4">
                      {selectedFeature.details.timelines.map((timeline, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{timeline.split(':')[0]}:</span>
                          <span className="font-bold text-purple-600">{timeline.split(':')[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-bold text-gray-800 mb-3">Real-time Notifications</h5>
                    <ul className="space-y-3">
                      {selectedFeature.details.notifications.map((notif, idx) => (
                        <li key={idx} className="flex items-center">
                          <Bell className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{notif}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedFeature.id === 'digital-reports' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3">Features</h4>
                      <ul className="space-y-2">
                        {selectedFeature.details.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3">Security & Privacy</h4>
                      <ul className="space-y-2">
                        {selectedFeature.details.security.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <ShieldIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                    <FileCheck className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <p className="text-lg font-bold text-gray-800">Lifetime Report Storage</p>
                    <p className="text-gray-600">Access your reports anytime from anywhere</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTests;