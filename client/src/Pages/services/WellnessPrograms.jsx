import React, { useState } from 'react';
import { 
  Heart,
  Home,
  Dumbbell,
  Apple,
  Brain,
  Moon,
  Activity,
  CheckCircle,
  Users,
  Calendar,
  Award,
  Target,
  TrendingUp,
  Sparkles,
  Zap,
  ChevronRight,
  Clock,
  Star
} from 'lucide-react';

const WellnessPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);

  const programs = [
    {
      id: 'fitness',
      name: 'Fitness & Exercise',
      icon: <Dumbbell className="w-8 h-8" />,
      tagline: 'Transform your body',
      price: '₹1,999',
      duration: '3 months',
      description: 'Personalized workout plans designed by certified trainers',
      features: [
        'Custom workout plans',
        'Video exercise library',
        'Progress tracking',
        'Weekly coach check-ins',
        'Nutrition guidance',
        'Fitness assessments'
      ],
      benefits: ['Lose weight', 'Build muscle', 'Improve stamina'],
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      popular: true
    },
    {
      id: 'nutrition',
      name: 'Nutrition & Diet',
      icon: <Apple className="w-8 h-8" />,
      tagline: 'Eat healthy, live better',
      price: '₹1,499',
      duration: '3 months',
      description: 'Customized meal plans created by expert nutritionists',
      features: [
        'Personalized meal plans',
        'Calorie tracking',
        'Recipe library',
        'Grocery shopping lists',
        'Nutritionist consultation',
        'Diet progress tracking'
      ],
      benefits: ['Healthy weight', 'More energy', 'Better digestion'],
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      popular: false
    },
    {
      id: 'mental',
      name: 'Mental Wellness',
      icon: <Brain className="w-8 h-8" />,
      tagline: 'Peace of mind matters',
      price: '₹1,799',
      duration: '3 months',
      description: 'Mindfulness and stress management programs',
      features: [
        'Meditation sessions',
        'Stress management techniques',
        'Therapy sessions',
        'Mindfulness exercises',
        'Sleep improvement tips',
        'Mood tracking'
      ],
      benefits: ['Reduce stress', 'Better sleep', 'Mental clarity'],
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      popular: true
    },
    {
      id: 'holistic',
      name: 'Holistic Health',
      icon: <Heart className="w-8 h-8" />,
      tagline: 'Complete wellness',
      price: '₹2,999',
      duration: '6 months',
      description: 'Comprehensive program combining fitness, nutrition, and mental wellness',
      features: [
        'All program features',
        'Yoga & meditation',
        'Life coaching',
        'Health assessments',
        'Priority support',
        'Community access'
      ],
      benefits: ['Total transformation', 'Sustainable habits', 'Long-term health'],
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      popular: false
    }
  ];

  const successStories = [
    {
      name: 'Priya S.',
      program: 'Fitness & Exercise',
      result: 'Lost 15kg in 4 months',
      image: '👩',
      rating: 5
    },
    {
      name: 'Rahul M.',
      program: 'Nutrition & Diet',
      result: 'Improved energy levels by 80%',
      image: '👨',
      rating: 5
    },
    {
      name: 'Anita K.',
      program: 'Mental Wellness',
      result: 'Reduced stress, better sleep',
      image: '👩',
      rating: 5
    },
    {
      name: 'Amit P.',
      program: 'Holistic Health',
      result: 'Complete lifestyle transformation',
      image: '👨',
      rating: 5
    }
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Expert Guidance',
      desc: 'Certified trainers & nutritionists',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Personalized Plans',
      desc: 'Customized to your goals',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Track Progress',
      desc: 'Monitor your improvements',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Proven Results',
      desc: '10,000+ success stories',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Take Assessment',
      desc: 'Complete health & fitness assessment',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      step: 2,
      title: 'Get Your Plan',
      desc: 'Receive personalized program',
      icon: <FileText className="w-6 h-6" />
    },
    {
      step: 3,
      title: 'Start Journey',
      desc: 'Begin with expert support',
      icon: <Zap className="w-6 h-6" />
    },
    {
      step: 4,
      title: 'Achieve Goals',
      desc: 'Track & celebrate progress',
      icon: <Award className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-white mb-6 hover:text-pink-100 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Services
          </button>

          <div className="flex items-center mb-4">
            <Heart className="w-10 h-10 md:w-12 md:h-12 mr-4 animate-pulse" />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              Wellness Programs
            </h1>
          </div>
          <p className="text-lg md:text-xl text-pink-100 max-w-3xl">
            Transform your health with personalized fitness, nutrition, and wellness programs designed by certified experts.
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
              <div className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Programs */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-800">
            Choose Your Wellness Journey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program) => (
              <div
                key={program.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2 ${
                  selectedProgram === program.id ? 'ring-4 ring-pink-500' : ''
                }`}
                onClick={() => setSelectedProgram(program.id)}
              >
                {program.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    POPULAR
                  </div>
                )}
                
                <div className={`bg-gradient-to-r ${program.color} p-6 text-white relative`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl inline-block mb-4 relative z-10">
                    {program.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-1 relative z-10">{program.name}</h3>
                  <p className="text-sm opacity-90 mb-4 relative z-10">{program.tagline}</p>
                  <div className="relative z-10">
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">{program.price}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {program.duration}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Includes:</h4>
                  <div className="space-y-2 mb-4">
                    {program.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-start text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                    {program.features.length > 4 && (
                      <div className="text-xs text-blue-600 font-medium">
                        +{program.features.length - 4} more features
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {program.benefits.map((benefit, idx) => (
                      <span key={idx} className={`text-xs px-2 py-1 rounded-full ${program.bgColor} font-medium`}>
                        {benefit}
                      </span>
                    ))}
                  </div>

                  <button
                    className={`w-full bg-gradient-to-r ${program.color} text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    Join Program <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-12 md:mb-20">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 text-gray-800">
            Success Stories
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {successStories.map((story, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="text-5xl mb-3 text-center">{story.image}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(story.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h4 className="font-bold text-gray-800 text-center mb-1">{story.name}</h4>
                <p className="text-xs text-gray-500 text-center mb-2">{story.program}</p>
                <p className="text-sm text-green-600 font-semibold text-center">{story.result}</p>
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
                <div className="bg-pink-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <div className="bg-pink-50 text-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
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

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 md:mb-20">
          {[
            { number: '10K+', label: 'Active Members', icon: <Users className="w-6 h-6" /> },
            { number: '50+', label: 'Expert Trainers', icon: <Award className="w-6 h-6" /> },
            { number: '95%', label: 'Success Rate', icon: <TrendingUp className="w-6 h-6" /> },
            { number: '4.9★', label: 'User Rating', icon: <Star className="w-6 h-6" /> }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="text-center bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="text-pink-600 mb-2 flex justify-center">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{stat.number}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse delay-75"></div>
          
          <h3 className="text-2xl md:text-4xl font-bold mb-4 relative z-10">
            Start Your Wellness Journey Today
          </h3>
          <p className="text-lg md:text-xl mb-8 text-white text-opacity-90 max-w-2xl mx-auto relative z-10">
            Join thousands of people who have transformed their health with our expert-guided programs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button className="bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
              Join Now <Sparkles className="w-5 h-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-pink-600 transition-all flex items-center justify-center gap-2 active:scale-95">
              Free Consultation <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileText = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default WellnessPrograms;