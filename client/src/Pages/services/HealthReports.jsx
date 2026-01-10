import React, { useState } from 'react';
import { 
  FileText,
  Home,
  TrendingUp,
  BarChart3,
  Brain,
  Heart,
  Activity,
  CheckCircle,
  Download,
  Share2,
  Lock,
  Eye,
  Calendar,
  AlertCircle,
  Zap,
  ChevronRight,
  LineChart
} from 'lucide-react';

const HealthReports = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const reportFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Analysis',
      desc: 'Advanced algorithms analyze your health data',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Trend Tracking',
      desc: 'Monitor your health parameters over time',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Visual Insights',
      desc: 'Easy-to-understand charts and graphs',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: <AlertCircle className="w-8 h-8" />,
      title: 'Smart Alerts',
      desc: 'Get notified of any health concerns',
      color: 'bg-red-100 text-red-600'
    }
  ];

  const reportTypes = [
    {
      id: 'basic',
      name: 'Basic Health Report',
      icon: <FileText className="w-8 h-8" />,
      price: 'Free',
      features: [
        'Test results summary',
        'Normal range comparison',
        'Basic recommendations',
        'PDF download'
      ],
      color: 'from-blue-500 to-cyan-600',
      popular: false
    },
    {
      id: 'detailed',
      name: 'Detailed Analysis',
      icon: <BarChart3 className="w-8 h-8" />,
      price: '₹299',
      features: [
        'All Basic features',
        'Trend analysis',
        'Visual charts & graphs',
        'Health score calculation',
        '6-month history tracking'
      ],
      color: 'from-purple-500 to-indigo-600',
      popular: true
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      icon: <Brain className="w-8 h-8" />,
      price: '₹599',
      features: [
        'All Detailed features',
        'AI-powered insights',
        'Personalized recommendations',
        'Risk assessment',
        'Doctor consultation included',
        'Lifetime report storage'
      ],
      color: 'from-pink-500 to-rose-600',
      popular: false
    }
  ];

  const sampleMetrics = [
    {
      name: 'Blood Pressure',
      value: '120/80',
      status: 'Normal',
      trend: 'stable',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      name: 'Blood Sugar',
      value: '95 mg/dL',
      status: 'Normal',
      trend: 'down',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      name: 'Cholesterol',
      value: '180 mg/dL',
      status: 'Optimal',
      trend: 'down',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      name: 'BMI',
      value: '23.5',
      status: 'Healthy',
      trend: 'stable',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-green-600'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Upload Results',
      desc: 'Upload your test results',
      icon: <FileText className="w-6 h-6" />
    },
    {
      step: 2,
      title: 'AI Analysis',
      desc: 'Our AI analyzes your data',
      icon: <Brain className="w-6 h-6" />
    },
    {
      step: 3,
      title: 'Get Insights',
      desc: 'Receive detailed report',
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      step: 4,
      title: 'Take Action',
      desc: 'Follow recommendations',
      icon: <CheckCircle className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-6 hover:text-indigo-100 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex items-center mb-4">
            <FileText className="w-10 h-10 md:w-12 md:h-12 mr-4" />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              Health Reports & Insights
            </h1>
          </div>
          <p className="text-lg md:text-xl text-indigo-100 max-w-3xl">
            Get detailed health analysis with AI-powered insights. Track your health trends and receive personalized recommendations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-20">
          {reportFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center hover:-translate-y-1"
            >
              <div className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Sample Dashboard Preview */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            Your Health at a Glance
          </h2>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {sampleMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${metric.color} bg-opacity-10 p-2 rounded-lg`}>
                      {metric.icon}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      metric.status === 'Normal' || metric.status === 'Optimal' || metric.status === 'Healthy'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {metric.status}
                    </span>
                  </div>
                  <h4 className="text-sm text-gray-600 mb-1">{metric.name}</h4>
                  <p className="text-2xl font-bold text-gray-800 mb-2">{metric.value}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className={`w-3 h-3 mr-1 ${
                      metric.trend === 'down' ? 'rotate-180 text-green-600' :
                      metric.trend === 'up' ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    {metric.trend === 'stable' ? 'Stable' : metric.trend === 'down' ? 'Improving' : 'Needs attention'}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white p-3 rounded-lg">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-2">AI Recommendation</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Your health metrics are in the optimal range. Continue maintaining your current lifestyle with regular exercise and balanced diet. Schedule your next checkup in 3 months.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                      ✓ Regular exercise
                    </span>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                      ✓ Balanced diet
                    </span>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                      ✓ Good sleep
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Choose Your Report Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2 ${
                  report.popular ? 'ring-4 ring-indigo-500' : ''
                }`}
              >
                {report.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold z-10">
                    POPULAR
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${report.color} p-6 text-white relative`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl inline-block mb-4 relative z-10">
                    {report.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 relative z-10">{report.name}</h3>
                  <div className="text-3xl font-bold relative z-10">{report.price}</div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {report.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`w-full bg-gradient-to-r ${report.color} text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95`}
                  >
                    Get Report
                  </button>
                </div>
              </div>
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
                <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <div className="bg-indigo-50 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          
          <h3 className="text-2xl md:text-4xl font-bold mb-4 relative z-10">
            Ready for Your Health Report?
          </h3>
          <p className="text-lg md:text-xl mb-8 text-white text-opacity-90 max-w-2xl mx-auto relative z-10">
            Get comprehensive insights about your health with AI-powered analysis and personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
              Generate Report <Zap className="w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-2 active:scale-95">
              View Sample <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthReports;