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
  ChevronRight
} from 'lucide-react';

const LabTests = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const testPackages = [
    {
      id: 1,
      name: 'Basic Health Checkup',
      icon: <Heart className="w-8 h-8" />,
      tests: 45,
      price: '₹999',
      originalPrice: '₹1,499',
      discount: '33% OFF',
      popular: true,
      includes: [
        'Complete Blood Count (CBC)',
        'Lipid Profile',
        'Blood Sugar Fasting',
        'Liver Function Test',
        'Kidney Function Test'
      ],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 2,
      name: 'Comprehensive Package',
      icon: <Activity className="w-8 h-8" />,
      tests: 85,
      price: '₹2,499',
      originalPrice: '₹3,999',
      discount: '38% OFF',
      popular: true,
      includes: [
        'All Basic Tests',
        'Thyroid Profile',
        'Vitamin D & B12',
        'HbA1c (Diabetes)',
        'ECG & Cardiac Markers'
      ],
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 3,
      name: 'Senior Citizen Care',
      icon: <Shield className="w-8 h-8" />,
      tests: 72,
      price: '₹1,999',
      originalPrice: '₹2,999',
      discount: '33% OFF',
      popular: false,
      includes: [
        'Complete Health Panel',
        'Bone Health Tests',
        'Cardiac Risk Markers',
        'Diabetes Screening',
        'Kidney & Liver Profile'
      ],
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 4,
      name: 'Women Wellness',
      icon: <Droplet className="w-8 h-8" />,
      tests: 60,
      price: '₹1,799',
      originalPrice: '₹2,499',
      discount: '28% OFF',
      popular: false,
      includes: [
        'Hormonal Profile',
        'Thyroid Tests',
        'Anemia Panel',
        'Bone Health',
        'Breast Cancer Markers'
      ],
      color: 'from-pink-500 to-rose-600'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Tests', icon: <TestTube className="w-4 h-4" /> },
    { id: 'blood', label: 'Blood Tests', icon: <Droplet className="w-4 h-4" /> },
    { id: 'urine', label: 'Urine Tests', icon: <TestTube className="w-4 h-4" /> },
    { id: 'imaging', label: 'Imaging', icon: <Activity className="w-4 h-4" /> },
    { id: 'cardiac', label: 'Cardiac', icon: <Heart className="w-4 h-4" /> }
  ];

  const features = [
    {
      icon: <Home className="w-8 h-8" />,
      title: 'Home Sample Collection',
      desc: 'Free sample collection from your doorstep'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'NABL Certified Labs',
      desc: 'Reports from certified and trusted labs'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Fast Results',
      desc: 'Get reports within 24-48 hours'
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: 'Digital Reports',
      desc: 'Access reports online anytime'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Select Test',
      desc: 'Choose from 1000+ tests',
      icon: <FileText className="w-6 h-6" />
    },
    {
      step: 2,
      title: 'Book Slot',
      desc: 'Pick convenient time',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      step: 3,
      title: 'Sample Collection',
      desc: 'Expert visits your home',
      icon: <Home className="w-6 h-6" />
    },
    {
      step: 4,
      title: 'Get Reports',
      desc: 'Digital reports in 24-48hrs',
      icon: <Download className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-6 hover:text-purple-100 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex items-center mb-4">
            <Microscope className="w-10 h-10 md:w-12 md:h-12 mr-4" />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              Lab Tests at Home
            </h1>
          </div>
          <p className="text-lg md:text-xl text-purple-100 max-w-3xl">
            Book lab tests online with free home sample collection. Get accurate reports from NABL certified labs delivered digitally.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-20">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center hover:-translate-y-1"
            >
              <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Test Packages */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Popular Health Packages
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2"
              >
                {pkg.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold z-10">
                    POPULAR
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white relative`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl inline-block mb-4 relative z-10">
                    {pkg.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 relative z-10">{pkg.name}</h3>
                  <div className="flex items-center text-sm mb-3 relative z-10">
                    <Package className="w-4 h-4 mr-1" />
                    {pkg.tests} Tests Included
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">{pkg.price}</span>
                      <span className="text-sm ml-2 line-through opacity-70">{pkg.originalPrice}</span>
                    </div>
                    <span className="bg-green-400 text-green-900 px-2 py-1 rounded text-xs font-bold">
                      {pkg.discount}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Includes:</h4>
                  <div className="space-y-2 mb-6">
                    {pkg.includes.map((item, idx) => (
                      <div key={idx} className="flex items-start text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`w-full bg-gradient-to-r ${pkg.color} text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95`}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            Browse by Category
          </h2>
          
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative text-center">
                <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <div className="bg-purple-50 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
                
                {idx < howItWorks.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          
          <h3 className="text-2xl md:text-4xl font-bold mb-4 relative z-10">
            Get Your Tests Done Today
          </h3>
          <p className="text-lg md:text-xl mb-8 text-white text-opacity-90 max-w-2xl mx-auto relative z-10">
            Book now and get free home sample collection with reports in 24-48 hours
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
              Book Lab Test <Zap className="w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-all flex items-center justify-center gap-2 active:scale-95">
              View All Tests <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabTests;