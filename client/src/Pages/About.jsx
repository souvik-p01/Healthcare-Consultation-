import React, { useState, useEffect, useContext } from 'react';
import { 
  Heart, 
  ArrowRight, 
  Target, 
  Lightbulb, 
  Award, 
  Shield, 
  Star, 
  Users 
} from 'lucide-react';

// Router simulation context - provides navigation functionality
const RouterContext = React.createContext();

// Custom hook for navigation
const useNavigate = () => {
  const { setCurrentPage } = useContext(RouterContext);
  return (path) => setCurrentPage(path);
};

// Link component simulation - handles navigation between pages
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

// AboutSection component - displays company information, team, and achievements
const AboutSection = () => {
  const [activeTab, setActiveTab] = useState('mission'); // Tracks active tab
  const [isVisible, setIsVisible] = useState(false); // Controls fade-in animation

  // Sets component to visible after mount to trigger animations
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Team members data
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
      experience: "15+ years"
    },
    {
      name: "Dr. Michael Chen",
      role: "AI Research Director",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
      experience: "12+ years"
    },
    {
      name: "Dr. Priya Patel",
      role: "Emergency Care Specialist",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
      experience: "10+ years"
    },
    {
      name: "Tech Lead Alex Kumar",
      role: "Platform Development",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
      experience: "8+ years"
    }
  ];

  // Company achievements data
  const achievements = [
    { icon: <Award className="w-6 h-6" />, title: "ISO 27001 Certified", desc: "Data security standard" },
    { icon: <Shield className="w-6 h-6" />, title: "HIPAA Compliant", desc: "Patient privacy protection" },
    { icon: <Star className="w-6 h-6" />, title: "4.9/5 Rating", desc: "From 10,000+ patients" },
    { icon: <Users className="w-6 h-6" />, title: "50K+ Users", desc: "Trusted worldwide" }
  ];

  return (
    <RouterContext.Provider value={{ setCurrentPage: () => {} }}>
      <section id="about" className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Hero Section - Introduction to the company */}
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              About <span className="text-blue-600">HealthCarePlus</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Revolutionizing healthcare through AI-powered technology, comprehensive medical services, 
              and a patient-centered approach that puts your wellness first.
            </p>
          </div>

          {/* Story Grid - Company history and image */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20 items-center">
            <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
                <img 
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
                  alt="Healthcare innovation" 
                  className="rounded-xl shadow-lg w-full"
                />
              </div>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Our Story</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Founded in 2020 with a vision to make quality healthcare accessible to everyone, 
                HealthCarePlus has grown from a small startup to a comprehensive healthcare platform 
                serving thousands of patients across India.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Our journey began when our founders experienced firsthand the challenges of accessing 
                timely medical care. Today, we combine cutting-edge AI technology with human expertise 
                to deliver personalized, efficient, and affordable healthcare solutions.
              </p>
              <Link to="/services" className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Explore Our Services <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          {/* Mission, Vision, Values Tabs - Company principles */}
          <div className="mb-20">
            <div className="flex flex-wrap justify-center mb-8">
              {['mission', 'vision', 'values'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 mx-2 mb-2 font-semibold capitalize transition-all duration-300 border-b-2 ${
                    activeTab === tab 
                      ? 'text-blue-600 border-blue-600' 
                      : 'text-gray-600 border-transparent hover:text-blue-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-w-4xl mx-auto">
              {activeTab === 'mission' && (
                <div className="text-center animate-fade-in">
                  <Target className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    To democratize healthcare by leveraging artificial intelligence and technology 
                    to provide accessible, affordable, and personalized medical care for everyone, 
                    regardless of their location or economic status.
                  </p>
                </div>
              )}
              {activeTab === 'vision' && (
                <div className="text-center animate-fade-in">
                  <Lightbulb className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Vision</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    To become the world's most trusted AI-powered healthcare platform, 
                    creating a future where quality medical care is instantly available 
                    to every person, everywhere, at any time.
                  </p>
                </div>
              )}
              {activeTab === 'values' && (
                <div className="animate-fade-in">
                  <Heart className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Our Values</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Patient First</h4>
                      <p className="text-gray-600">Every decision prioritizes patient welfare and experience</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Innovation</h4>
                      <p className="text-gray-600">Continuously advancing healthcare through technology</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Integrity</h4>
                      <p className="text-gray-600">Transparent, honest, and ethical in all our practices</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Accessibility</h4>
                      <p className="text-gray-600">Making quality healthcare available to everyone</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Section - Team member profiles */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Meet Our Expert Team</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
                >
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h4 className="font-semibold text-gray-800 mb-1">{member.name}</h4>
                  <p className="text-blue-600 text-sm mb-2">{member.role}</p>
                  <p className="text-gray-500 text-sm">{member.experience}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Section - Company accomplishments */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Achievements</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    {achievement.icon}
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{achievement.title}</h4>
                  <p className="text-gray-600 text-sm">{achievement.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Animation styles */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fadeIn 0.8s ease-in-out;
          }
        `}</style>
      </section>
    </RouterContext.Provider>
  );
};

export default AboutSection;