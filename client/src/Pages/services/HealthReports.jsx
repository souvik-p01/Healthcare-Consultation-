import React, { useState, useEffect } from 'react';
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
  LineChart,
  X,
  Search,
  User,
  Clock,
  Shield,
  Upload,
  Filter,
  Printer,
  Bookmark,
  ExternalLink,
  Smartphone,
  Cpu,
  Sparkles,
  Target,
  RefreshCw,
  Database,
  Cloud,
  Battery,
  Thermometer,
  Scale,
  Moon,
  Sunrise,
  Coffee
} from 'lucide-react';

const HealthReports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeatureDetail, setShowFeatureDetail] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showSampleReport, setShowSampleReport] = useState(false);
  const [healthScore, setHealthScore] = useState(85);
  const [selectedDateRange, setSelectedDateRange] = useState('last_30_days');

  // Simulate report generation
  useEffect(() => {
    if (generatingReport) {
      const interval = setInterval(() => {
        setReportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setGeneratingReport(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [generatingReport]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files.slice(0, 5)]); // Limit to 5 files
  };

  const generateHealthReport = () => {
    setGeneratingReport(true);
    setReportProgress(0);
    
    setTimeout(() => {
      setShowReportModal(true);
      setSelectedReport({
        type: 'detailed',
        name: 'Comprehensive Health Analysis',
        generatedAt: new Date().toLocaleDateString(),
        score: healthScore
      });
    }, 3000);
  };

  const reportFeatures = [
    {
      id: 'ai-analysis',
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Analysis',
      desc: 'Advanced algorithms analyze your health data',
      color: 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600',
      details: {
        technology: ['Machine Learning Models', 'Deep Learning Algorithms', 'Natural Language Processing'],
        capabilities: [
          'Pattern recognition in health data',
          'Predictive health risk assessment',
          'Personalized recommendation engine',
          'Anomaly detection in test results'
        ],
        accuracy: '95% accuracy rate',
        processing: 'Real-time analysis of 100+ parameters'
      }
    },
    {
      id: 'trend-tracking',
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Trend Tracking',
      desc: 'Monitor your health parameters over time',
      color: 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600',
      details: {
        timeline: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        metrics: [
          'Blood pressure trends',
          'Glucose level patterns',
          'Weight & BMI progression',
          'Sleep quality analysis',
          'Activity level tracking'
        ],
        insights: [
          'Identify improvement patterns',
          'Detect early warning signs',
          'Track treatment effectiveness',
          'Set and monitor health goals'
        ]
      }
    },
    {
      id: 'visual-insights',
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Visual Insights',
      desc: 'Easy-to-understand charts and graphs',
      color: 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600',
      details: {
        chartTypes: ['Line Charts', 'Bar Graphs', 'Pie Charts', 'Heat Maps', 'Scatter Plots'],
        visualizations: [
          'Interactive dashboards',
          'Comparison charts',
          'Progress timelines',
          'Risk assessment visuals',
          'Goal tracking widgets'
        ],
        customization: [
          'Custom date ranges',
          'Parameter comparisons',
          'Export as image/PDF',
          'Shareable visual reports'
        ]
      }
    },
    {
      id: 'smart-alerts',
      icon: <AlertCircle className="w-8 h-8" />,
      title: 'Smart Alerts',
      desc: 'Get notified of any health concerns',
      color: 'bg-gradient-to-br from-red-100 to-orange-100 text-red-600',
      details: {
        alertTypes: ['Critical', 'Warning', 'Informational', 'Reminder'],
        triggers: [
          'Abnormal test results',
          'Medication reminders',
          'Appointment alerts',
          'Health goal milestones',
          'Risk threshold breaches'
        ],
        notifications: [
          'Push notifications',
          'Email alerts',
          'SMS alerts',
          'In-app notifications',
          'Doctor notifications'
        ]
      }
    }
  ];

  const reportTypes = [
    {
      id: 'basic',
      name: 'Basic Health Report',
      icon: <FileText className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      price: 'Free',
      features: [
        'Test results summary',
        'Normal range comparison',
        'Basic recommendations',
        'PDF download',
        '30-day history access'
      ],
      color: 'from-blue-500 to-cyan-600',
      popular: false,
      processingTime: 'Instant',
      bestFor: 'Quick overview of recent tests'
    },
    {
      id: 'detailed',
      name: 'Detailed Analysis',
      icon: <BarChart3 className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      price: '₹299',
      features: [
        'All Basic features',
        'Trend analysis (6 months)',
        'Visual charts & graphs',
        'Health score calculation',
        'Personalized insights',
        'Comparative analysis'
      ],
      color: 'from-purple-500 to-indigo-600',
      popular: true,
      processingTime: '2-5 minutes',
      bestFor: 'Comprehensive health understanding'
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      icon: <Brain className="w-8 h-8" />,
      logo: (
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
      ),
      price: '₹599',
      features: [
        'All Detailed features',
        'AI-powered predictive insights',
        'Personalized action plan',
        'Risk assessment & prevention',
        'Doctor consultation included',
        'Lifetime report storage',
        'Family health insights'
      ],
      color: 'from-pink-500 to-rose-600',
      popular: false,
      processingTime: '5-10 minutes',
      bestFor: 'Complete health management'
    }
  ];

  const healthMetrics = [
    {
      id: 'bp',
      name: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'optimal',
      trend: 'stable',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      range: 'Normal: <120/80',
      lastUpdated: '2 days ago',
      improvement: '+2%'
    },
    {
      id: 'glucose',
      name: 'Blood Sugar',
      value: '95',
      unit: 'mg/dL',
      status: 'normal',
      trend: 'down',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      range: 'Normal: 70-99',
      lastUpdated: '1 week ago',
      improvement: '-5%'
    },
    {
      id: 'cholesterol',
      name: 'Cholesterol',
      value: '180',
      unit: 'mg/dL',
      status: 'optimal',
      trend: 'down',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      range: 'Optimal: <200',
      lastUpdated: '1 week ago',
      improvement: '-8%'
    },
    {
      id: 'bmi',
      name: 'BMI',
      value: '23.5',
      unit: 'kg/m²',
      status: 'healthy',
      trend: 'stable',
      icon: <Scale className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      range: 'Healthy: 18.5-24.9',
      lastUpdated: 'Today',
      improvement: '-1.2%'
    },
    {
      id: 'sleep',
      name: 'Sleep Quality',
      value: '7.5',
      unit: 'hours',
      status: 'good',
      trend: 'up',
      icon: <Moon className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      range: 'Good: 7-9 hours',
      lastUpdated: 'Today',
      improvement: '+0.5 hours'
    },
    {
      id: 'activity',
      name: 'Daily Activity',
      value: '8,500',
      unit: 'steps',
      status: 'good',
      trend: 'up',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      range: 'Good: 7,500+',
      lastUpdated: 'Today',
      improvement: '+12%'
    },
    {
      id: 'hydration',
      name: 'Hydration',
      value: '2.5',
      unit: 'liters',
      status: 'optimal',
      trend: 'stable',
      icon: <Coffee className="w-5 h-5" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      range: 'Optimal: 2-3 liters',
      lastUpdated: 'Today',
      improvement: '+15%'
    },
    {
      id: 'stress',
      name: 'Stress Level',
      value: '3.2',
      unit: '/10',
      status: 'moderate',
      trend: 'down',
      icon: <Brain className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      range: 'Low: <3',
      lastUpdated: 'Today',
      improvement: '-18%'
    }
  ];

  const dateRanges = [
    { id: 'today', label: 'Today' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days', default: true },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'last_6_months', label: 'Last 6 Months' },
    { id: 'custom', label: 'Custom Range' }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Upload Results',
      desc: 'Upload your test results or sync devices',
      icon: <Upload className="w-6 h-6" />,
      tech: 'Cloud Storage & OCR'
    },
    {
      step: 2,
      title: 'AI Analysis',
      desc: 'Our AI analyzes your health data',
      icon: <Cpu className="w-6 h-6" />,
      tech: 'Machine Learning Models'
    },
    {
      step: 3,
      title: 'Get Insights',
      desc: 'Receive detailed AI-powered report',
      icon: <Sparkles className="w-6 h-6" />,
      tech: 'Predictive Analytics'
    },
    {
      step: 4,
      title: 'Take Action',
      desc: 'Follow personalized recommendations',
      icon: <Target className="w-6 h-6" />,
      tech: 'Actionable Intelligence'
    }
  ];

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleGenerateReport = () => {
    if (!selectedReport) {
      alert('Please select a report type first');
      return;
    }
    generateHealthReport();
  };

  const downloadReport = (format = 'pdf') => {
    alert(`Downloading report in ${format.toUpperCase()} format...`);
    // In real app, this would trigger actual download
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Health Report',
        text: 'Check out my health report generated by HealthConnect',
        url: window.location.href,
      });
    } else {
      alert('Report link copied to clipboard!');
      // Fallback copy to clipboard
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-8 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-4 md:mb-6 hover:text-indigo-100 transition-colors text-sm md:text-base bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
            <div className="mb-4 md:mb-0 md:mr-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2">
                Health Reports & Insights
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl">
                Get detailed health analysis with AI-powered insights. Track your health trends and receive personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {reportFeatures.map((feature) => (
            <div
              key={feature.id}
              onClick={() => setShowFeatureDetail(feature)}
              className="bg-white p-5 md:p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
            >
              <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-base md:text-lg">{feature.title}</h3>
              <p className="text-xs md:text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Health Dashboard */}
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
                Your Health at a Glance
              </h2>
              <p className="text-gray-600">Real-time insights from your connected devices & tests</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  {dateRanges.map(range => (
                    <option key={range.id} value={range.id}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold">{healthScore}</div>
                  <div className="text-xs">
                    Health<br/>Score
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {['overview', 'metrics', 'trends', 'insights'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {healthMetrics.slice(0, 4).map((metric) => (
                      <div
                        key={metric.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`${metric.bgColor} p-2 rounded-lg`}>
                            {metric.icon}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            metric.status === 'optimal' || metric.status === 'normal' || metric.status === 'healthy'
                              ? 'bg-green-100 text-green-700'
                              : metric.status === 'good'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {metric.status}
                          </span>
                        </div>
                        <h4 className="text-sm text-gray-600 mb-1">{metric.name}</h4>
                        <p className="text-2xl font-bold text-gray-800 mb-1">
                          {metric.value}
                          <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{metric.range}</span>
                          <span className={`flex items-center ${metric.improvement.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            <TrendingUp className={`w-3 h-3 mr-1 ${metric.improvement.startsWith('-') ? 'rotate-180' : ''}`} />
                            {metric.improvement}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Recommendation */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-3 rounded-xl">
                        <Brain className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-800 text-lg">AI Recommendation</h3>
                          <span className="text-xs font-medium px-3 py-1 bg-white rounded-full">
                            Updated: Today
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Your health metrics are showing excellent improvement! Your sleep quality and activity levels have improved significantly. Continue with your current routine and consider adding 10 minutes of meditation to further reduce stress levels.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                            ✅ Regular exercise
                          </span>
                          <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                            ✅ Balanced diet
                          </span>
                          <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                            💪 Increase hydration
                          </span>
                          <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                            🧘 Add meditation
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {healthMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`${metric.bgColor} p-2 rounded-lg`}>
                          {metric.icon}
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            metric.status === 'optimal' || metric.status === 'normal' || metric.status === 'healthy'
                              ? 'bg-green-100 text-green-700'
                              : metric.status === 'good'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {metric.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{metric.lastUpdated}</p>
                        </div>
                      </div>
                      <h4 className="text-sm text-gray-600 mb-1">{metric.name}</h4>
                      <p className="text-2xl font-bold text-gray-800 mb-1">
                        {metric.value}
                        <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{metric.range}</span>
                        <span className={`flex items-center ${metric.improvement.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          <TrendingUp className={`w-3 h-3 mr-1 ${metric.improvement.startsWith('-') ? 'rotate-180' : ''}`} />
                          {metric.improvement}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Choose Your Report Type
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                  report.popular ? 'ring-4 ring-indigo-500' : ''
                }`}
              >
                {report.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold z-10">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${report.color} p-6 md:p-8 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    {report.logo}
                    <div className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {report.processingTime}
                    </div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-2 relative z-10">{report.name}</h3>
                  <div className="text-3xl md:text-4xl font-bold mb-3 relative z-10">{report.price}</div>
                  <p className="text-sm opacity-90 relative z-10">{report.bestFor}</p>
                </div>

                <div className="p-6 md:p-8">
                  <div className="space-y-3 mb-6">
                    {report.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReportSelect(report)}
                      className={`flex-1 bg-gradient-to-r ${report.color} text-white py-3.5 rounded-xl font-bold hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3`}
                    >
                      Get Report
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowSampleReport(true)}
                      className="px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                      title="View sample"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-12 md:mb-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Upload Your Test Reports
              </h3>
              <p className="text-gray-600 mb-4">
                Upload PDF or image files of your test reports for AI analysis
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200">
                  PDF, JPG, PNG
                </span>
                <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200">
                  Max 10MB per file
                </span>
                <span className="bg-white px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200">
                  Secure & encrypted
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Reports
                </div>
              </label>
              {uploadedFiles.length > 0 && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                </p>
              )}
            </div>
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
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
                  <div className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
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
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-4xl font-bold mb-4">
              Ready for Your Health Report?
            </h3>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Get comprehensive insights about your health with AI-powered analysis and personalized recommendations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {generatingReport ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating ({reportProgress}%)
                  </>
                ) : (
                  <>
                    Generate Report
                    <Zap className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSampleReport(true)}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                View Sample
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedReport.name}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Generated on {selectedReport.generatedAt}
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Health Score</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${selectedReport.score * 2.83} 283`}
                            transform="rotate(-90 50 50)"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-800">{selectedReport.score}</div>
                            <div className="text-sm text-gray-600">out of 100</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm">Excellent (80-100)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          <span className="text-sm">Good (60-79)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-sm">Needs Improvement (&lt;60)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-gray-600">Within Range</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-gray-600">Parameters</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-purple-600">8</div>
                      <div className="text-sm text-gray-600">Improvements</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-indigo-600">3</div>
                      <div className="text-sm text-gray-600">Recommendations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Sections */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    AI Analysis Summary
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Our AI analysis shows excellent overall health with consistent improvement in key areas. 
                    Your blood pressure, glucose levels, and cholesterol are all within optimal ranges. 
                    Continue with your current exercise and diet regimen.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-bold text-green-800 mb-2">Strengths</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          Excellent cardiovascular health
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          Consistent exercise routine
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          Balanced nutrition
                        </li>
                      </ul>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-bold text-yellow-800 mb-2">Areas to Watch</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                          Consider stress management techniques
                        </li>
                        <li className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                          Increase daily hydration by 500ml
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Personalized Recommendations</h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Increase Water Intake', desc: 'Aim for 3 liters per day', priority: 'High' },
                      { title: 'Add Meditation', desc: '10 minutes daily for stress management', priority: 'Medium' },
                      { title: 'Sleep Optimization', desc: 'Maintain 7-8 hours consistently', priority: 'Medium' }
                    ].map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          rec.priority === 'High' ? 'bg-red-100 text-red-600' :
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{rec.title}</h4>
                          <p className="text-sm text-gray-600">{rec.desc}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadReport('pdf')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={shareReport}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={() => downloadReport('image')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  </div>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal */}
      {showFeatureDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`${showFeatureDetail.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  {showFeatureDetail.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{showFeatureDetail.title}</h3>
                  <p className="text-gray-600">{showFeatureDetail.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeatureDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {showFeatureDetail.id === 'ai-analysis' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">Technology Stack</h4>
                    <div className="flex flex-wrap gap-3">
                      {showFeatureDetail.details.technology.map((tech, idx) => (
                        <span key={idx} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">Capabilities</h4>
                    <ul className="space-y-2">
                      {showFeatureDetail.details.capabilities.map((cap, idx) => (
                        <li key={idx} className="flex items-start">
                          <Cpu className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                    <Brain className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <p className="text-lg font-bold text-gray-800">{showFeatureDetail.details.accuracy}</p>
                    <p className="text-gray-600">{showFeatureDetail.details.processing}</p>
                  </div>
                </div>
              )}

              {/* Similar detail sections for other features */}
            </div>
          </div>
        </div>
      )}

      {/* Sample Report Modal */}
      {showSampleReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Sample Health Report</h2>
              <button
                onClick={() => setShowSampleReport(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Comprehensive Health Analysis</h3>
                <p className="opacity-90">Sample generated for demonstration purposes</p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-bold text-gray-800 mb-3">Sample Health Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {healthMetrics.slice(0, 4).map(metric => (
                      <div key={metric.id} className="bg-white p-4 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">{metric.value}{metric.unit}</div>
                        <div className="text-sm text-gray-600">{metric.name}</div>
                        <div className="text-xs text-green-600 mt-1">{metric.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    This is a preview of how your personalized health report will look.
                    Sign up to generate your own comprehensive report.
                  </p>
                  <button
                    onClick={() => {
                      setShowSampleReport(false);
                      handleGenerateReport();
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Generate Your Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthReports;