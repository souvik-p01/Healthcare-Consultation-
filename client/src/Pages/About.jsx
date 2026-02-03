import React, { useState, useEffect, useContext } from 'react';
import { 
  Heart, 
  ArrowRight, 
  Target, 
  Lightbulb, 
  Award, 
  Shield, 
  Star, 
  Users,
  ChevronRight,
  Sparkles,
  Globe,
  Clock,
  CheckCircle,
  Brain,
  Zap,
  Lock,
  Smartphone,
  Stethoscope,
  Microscope
} from 'lucide-react';
import profImage1 from "../assets/aboutprofilepics/prof_subhashis_misra.jpg";
import profImage2 from "../assets/aboutprofilepics/souvik-patra-pic.jpg";
import profImage3 from "../assets/aboutprofilepics/sanchita-lakshman-pic.png";


// Router simulation context
const RouterContext = React.createContext();

// Custom hook for navigation
const useNavigate = () => {
  const { setCurrentPage } = useContext(RouterContext);
  return (path) => setCurrentPage(path);
};

// Link component
const Link = ({ to, children, className }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={className}
    >
      {children}
    </button>
  );
};

// AboutSection Component
const AboutSection = () => {
  const [activeTab, setActiveTab] = useState('mission');
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredTeamMember, setHoveredTeamMember] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const teamMembers = [
    {
      name: "Prof. Subhashis Misra",
      role: "Assistant Professor",
      image: profImage1,
      experience: "15+ years",
      specialization: "Master of Technology in SQL and Learning Systems",
      education: "Jadavpur University",
      funFact: "Cloud computing, Learning Management Systems enthusiast"
    },
    {
      name: "Souvik Patra",
      role: "Team Lead & Full-Stack Developer",
      image: profImage2,
      experience: "Full-stack development",
      specialization: "Healthcare systems, APIs & databases",
      education: "Computer Science Engineering",
      funFact: "Handles backend, frontend, and database end-to-end"
    },
    {
      name: "Sanchita Lakshman",
      role: "UI & System Design Contributor",
      image: profImage3,
      experience: "Project-based experience",
      specialization: "UI design, system diagrams & frontend support",
      education: "Computer Science Engineering",
      funFact: "Created system diagrams and supported frontend development"
    },
    // {
    //   name: "Alex Kumar",
    //   role: "Tech Lead",
    //   image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    //   experience: "8+ years",
    //   specialization: "Platform Development",
    //   education: "MTech, IIT Bombay",
    //   funFact: "Built scalable systems for 1M+ users"
    // }
  ];

  const achievements = [
    { 
      icon: <Award className="w-6 h-6" />, 
      title: "ISO 27001 Certified", 
      desc: "Data security standard",
      count: "99.9%",
      subtext: "Uptime"
    },
    { 
      icon: <Shield className="w-6 h-6" />, 
      title: "HIPAA Compliant", 
      desc: "Patient privacy protection",
      count: "Zero",
      subtext: "Security breaches"
    },
    { 
      icon: <Star className="w-6 h-6" />, 
      title: "4.9/5 Rating", 
      desc: "From 10,000+ patients",
      count: "10K+",
      subtext: "Happy Patients"
    },
    { 
      icon: <Users className="w-6 h-6" />, 
      title: "50K+ Users", 
      desc: "Trusted worldwide",
      count: "25+",
      subtext: "Cities covered"
    }
  ];

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Diagnosis",
      description: "Our advanced AI analyzes symptoms with 95% accuracy, providing instant preliminary assessments.",
      benefits: ["24/7 Available", "95% Accuracy", "Instant Results"]
    },
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: "Expert Medical Team",
      description: "Board-certified doctors with an average of 10+ years experience across all medical specialties.",
      benefits: ["10+ Years Avg Experience", "All Specialties", "Quick Response"]
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Telemedicine First",
      description: "Connect with specialists via video consultation from anywhere, reducing wait times by 80%.",
      benefits: ["Video Consultations", "No Travel Needed", "80% Less Wait Time"]
    },
    {
      icon: <Microscope className="w-8 h-8" />,
      title: "Advanced Diagnostics",
      description: "Access to cutting-edge diagnostic tools and lab tests with same-day results in most cases.",
      benefits: ["Same-day Results", "300+ Tests Available", "Home Collection"]
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Bank-level encryption ensures your medical data remains completely confidential and secure.",
      benefits: ["End-to-end Encryption", "HIPAA Compliant", "Data Ownership"]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Prescriptions",
      description: "Get digital prescriptions instantly delivered to your phone and local pharmacies.",
      benefits: ["Digital Delivery", "Pharmacy Integration", "Medication Tracking"]
    }
  ];

  const stats = [
    { number: "50K+", label: "Patients Served", icon: <Users className="w-5 h-5" /> },
    { number: "10K+", label: "Successful Diagnoses", icon: <CheckCircle className="w-5 h-5" /> },
    { number: "24/7", label: "Service Availability", icon: <Clock className="w-5 h-5" /> },
    { number: "95%", label: "Patient Satisfaction", icon: <Heart className="w-5 h-5" /> }
  ];

  return (
    <RouterContext.Provider value={{ setCurrentPage: () => {} }}>
      <section id="about" className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-white to-blue-50/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className={`text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center mb-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Revolutionizing Healthcare Since 2020
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
              About <span className="text-blue-600">HealthCare</span>
              <span className="text-blue-400">Plus</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl lg:max-w-4xl mx-auto leading-relaxed px-4">
              We're transforming healthcare through AI-powered technology, comprehensive medical services, 
              and a patient-centered approach that puts your wellness first.
            </p>
          </div>

          {/* Story Grid */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 mb-16 md:mb-20 lg:mb-24 items-center">
            <div className={`order-2 lg:order-1 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-6 md:p-8">
                  <img 
                    src="https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80" 
                    alt="Healthcare innovation" 
                    className="rounded-2xl shadow-2xl w-full h-auto"
                  />
                </div>
                {/* Stats overlay for desktop */}
                <div className="hidden lg:flex absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">50K+</div>
                    <div className="text-sm text-gray-600">Patients Served</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`order-1 lg:order-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">Our Journey</h2>
              <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-base md:text-lg">
                Founded in 2020 with a vision to make quality healthcare accessible to everyone, 
                HealthCarePlus has grown from a small startup to a comprehensive healthcare platform 
                serving thousands of patients across India.
              </p>
              <p className="text-gray-600 mb-6 md:mb-8 leading-relaxed text-base md:text-lg">
                Our journey began when our founders experienced firsthand the challenges of accessing 
                timely medical care. Today, we combine cutting-edge AI technology with human expertise 
                to deliver personalized, efficient, and affordable healthcare solutions.
              </p>
              
              {/* Mobile-friendly stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 lg:hidden">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-blue-600">50K+</div>
                  <div className="text-sm text-gray-600">Patients</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-blue-600">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>

              <Link to="/services" className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg w-full sm:w-auto">
                Explore Our Services 
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-16 md:mb-20 lg:mb-24">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 md:p-8 lg:p-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center text-white">
                    <div className="flex justify-center mb-3">
                      <div className="bg-white/20 p-3 rounded-full">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1">{stat.number}</div>
                    <div className="text-blue-100 text-sm md:text-base">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mission, Vision, Values */}
          <div className="mb-16 md:mb-20 lg:mb-24">
            <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
              {['mission', 'vision', 'values'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 mx-1 font-semibold capitalize transition-all duration-300 rounded-lg ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-w-4xl mx-auto">
              {activeTab === 'mission' && (
                <div className="text-center animate-fade-in">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    To democratize healthcare by leveraging artificial intelligence and technology 
                    to provide accessible, affordable, and personalized medical care for everyone, 
                    regardless of their location or economic status.
                  </p>
                </div>
              )}
              
              {activeTab === 'vision' && (
                <div className="text-center animate-fade-in">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lightbulb className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    To become the world's most trusted AI-powered healthcare platform, 
                    creating a future where quality medical care is instantly available 
                    to every person, everywhere, at any time.
                  </p>
                </div>
              )}
              
              {activeTab === 'values' && (
                <div className="animate-fade-in">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Values</h3>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    {[
                      { title: "Patient First", desc: "Every decision prioritizes patient welfare and experience", icon: <Heart className="w-5 h-5" /> },
                      { title: "Innovation", desc: "Continuously advancing healthcare through technology", icon: <Sparkles className="w-5 h-5" /> },
                      { title: "Integrity", desc: "Transparent, honest, and ethical in all our practices", icon: <Shield className="w-5 h-5" /> },
                      { title: "Accessibility", desc: "Making quality healthcare available to everyone", icon: <Globe className="w-5 h-5" /> },
                      { title: "Excellence", desc: "Setting highest standards in medical care", icon: <Star className="w-5 h-5" /> },
                      { title: "Compassion", desc: "Treating every patient with empathy and care", icon: <Heart className="w-5 h-5" /> }
                    ].map((value, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start">
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-lg mr-4">
                            {value.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{value.title}</h4>
                            <p className="text-gray-600 text-sm">{value.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="mb-16 md:mb-20 lg:mb-24">
            <div className="text-center mb-8 md:mb-12">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Why Choose HealthCare<span className="text-blue-600">Plus</span>?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience healthcare that's smarter, faster, and more personalized than ever before
              </p>
            </div>

            {/* Feature Tabs for Mobile */}
            <div className="lg:hidden mb-8">
              <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      activeFeature === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {feature.title.split(' ')[0]}
                  </button>
                ))}
              </div>
              
              {/* Mobile Feature Display */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-xl mr-4">
                    {features[activeFeature].icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{features[activeFeature].title}</h4>
                </div>
                <p className="text-gray-600 mb-4">{features[activeFeature].description}</p>
                <div className="flex flex-wrap gap-2">
                  {features[activeFeature].benefits.map((benefit, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Features Grid */}
            <div className="hidden lg:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer"
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-blue-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.benefits.map((benefit, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16 md:mb-20 lg:mb-24">
            <div className="text-center mb-8 md:mb-12">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Meet Our Expert Team</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">Dedicated professionals with decades of combined experience</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={index}
                  className="relative group"
                  onMouseEnter={() => setHoveredTeamMember(index)}
                  onMouseLeave={() => setHoveredTeamMember(null)}
                >
                  <div className={`bg-white border border-gray-200 rounded-2xl p-6 text-center transition-all duration-300 ${
                    hoveredTeamMember === index 
                      ? 'transform -translate-y-2 shadow-xl border-blue-200' 
                      : 'shadow-sm hover:shadow-md'
                  }`}>
                    <div className="relative mb-6">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute bottom-0 right-1/4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {member.experience}
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{member.name}</h4>
                    <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                    <p className="text-gray-600 text-sm mb-3">{member.specialization}</p>
                    
                    {/* Mobile expanded info */}
                    <div className="lg:hidden mt-4 text-left">
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {member.education}
                      </div>
                      <p className="text-gray-500 text-sm italic">"{member.funFact}"</p>
                    </div>
                    
                    {/* Desktop hover info */}
                    <div className={`hidden lg:block absolute inset-0 bg-gradient-to-b from-blue-600/95 to-blue-700/95 rounded-2xl p-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 ${
                      hoveredTeamMember === index ? 'translate-y-0' : 'translate-y-4'
                    }`}>
                      <h4 className="font-bold text-lg mb-2">{member.name}</h4>
                      <p className="text-blue-100 mb-3">{member.role}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2" />
                          {member.education}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {member.experience} experience
                        </div>
                        <p className="mt-4 text-blue-100 italic">"{member.funFact}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 md:p-8 lg:p-12">
            <div className="text-center mb-8 md:mb-12">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Our Achievements</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">Trusted by thousands, recognized for excellence</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 group"
                >
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="text-blue-600">
                      {achievement.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{achievement.count}</div>
                  <h4 className="font-semibold text-gray-800 mb-2">{achievement.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{achievement.desc}</p>
                  <p className="text-blue-600 text-xs font-medium">{achievement.subtext}</p>
                </div>
              ))}
            </div>
            
            {/* Call to Action */}
            <div className="text-center mt-12">
              <p className="text-gray-700 mb-6 text-lg font-medium">Ready to experience better healthcare?</p>
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border-2 border-blue-100"
              >
                Get Started Today 
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        /* Hide scrollbar for mobile feature tabs */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better image rendering */
        img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        /* Print styles */
        @media print {
          .hover\\:shadow-lg,
          .hover\\:shadow-md {
            box-shadow: none !important;
          }
          .transform {
            transform: none !important;
          }
        }
      `}</style>
    </RouterContext.Provider>
  );
};

export default AboutSection;