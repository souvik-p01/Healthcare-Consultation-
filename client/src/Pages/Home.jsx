import HeroSection from '../components/HeroSection';
import FeaturedSection from '../components/FeaturesSection';
import UserRoleSection from '../components/UserRolesSection';
import StatsSection from '../components/StatsSection';

const Home = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen">
        <HeroSection />
        <FeaturedSection />
        <UserRoleSection />
        <StatsSection />
    </div>
  )
}

export default Home