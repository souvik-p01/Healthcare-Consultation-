import { useState } from 'react';
import Home from './Pages/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import About from './Pages/About';
import Service from './Pages/Service';
import PatientPortal from './Pages/PatientPortal';
import DoctorPortal from './Pages/DoctorPortal';
import TechnicianPortal from './Pages/TechnicianPortal';
import './index.css'
import { Routes, Route } from 'react-router-dom';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col justify-center min-h-screen">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Service />} />
        <Route path="/patient-portal" element={<PatientPortal />} />
        <Route path="/doctor-portal" element={<DoctorPortal />} />
        <Route path="/technician-portal" element={<TechnicianPortal />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;