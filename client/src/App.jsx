import { useState } from 'react';
import Home from './Pages/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import About from './Pages/About';
import Service from './Pages/Service';
import Contact from './Pages/Contact';
import PatientPortal from './Pages/PatientPortal';
import DoctorPortal from './Pages/DoctorPortal';
import TechnicianPortal from './Pages/TechnicianPortal';
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {toast, ToastContainer} from 'react-toastify'
import LoginSignUpPage from './Pages/LoginSignUpPage';


const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col justify-center min-h-screen">
      <ToastContainer position="bottom-right" toastStyle={{backgroundColor: "#000"}} />
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Service />} />
        <Route path="/patient-portal" element={<PatientPortal />} />
        <Route path="/doctor-portal" element={<DoctorPortal />} />
        <Route path="/technician-portal" element={<TechnicianPortal />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<LoginSignUpPage />} />
      </Routes>
      < ToastContainer />
      <Footer />
    </div>
  );
};

export default App;