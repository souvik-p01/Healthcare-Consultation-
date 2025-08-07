import { useState } from 'react';


import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import StatsSection from './components/StatsSection';
import UserRolesSection from './components/UserRolesSection';
import Footer from './components/Footer';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <UserRolesSection />
      <Footer />
    </div>
  );
};

export default App;
