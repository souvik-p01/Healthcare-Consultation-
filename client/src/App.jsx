import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'

/* -------- Layout Components -------- */
import Header from './components/Header'
import Footer from './components/Footer'
import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'

/* -------- Existing Pages -------- */
import Home from './Pages/Home'
import About from './Pages/About'
import Service from './Pages/Service'
import Contact from './Pages/Contact'
import PatientPortal from './Pages/PatientPortal'
import DoctorPortal from './Pages/DoctorPortal'
import TechnicianPortal from './Pages/TechnicianPortal'
import Dashboard from './Pages/Dashboard'
import LoginSignUpPage from './Pages/LoginSignUpPage'
import ProfileCompletion from './Pages/ProfileCompletion'

/* -------- New AI Healthcare Pages -------- */
import HomePage from './Pages/Home'
import ServicesPage from './Pages/Service'
import AIAssistantPage from './Pages/AIAssistantPage'
import ConsultationsPage from './Pages/ConsultationsPage'
import EmergencyPage from './Pages/EmergencyPage'
import PharmacyPage from './Pages/PharmacyPage'
import MonitoringPage from './Pages/MonitoringPage'
import RecordsPage from './Pages/RecordsPage'



const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col w-full">
      
      {/* Top Navbar (Your Main Site) */}
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* AI Healthcare Navigation Bar – only show on AI pages */}
          {location.pathname.startsWith('/ai') && <Navigation />}


      {/* Main Content */}
      <main className="flex-grow">
        <Routes>

          {/* ===== Main Website ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Service />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginSignUpPage />} />

          <Route path="/patient-portal" element={<PatientPortal />} />
          <Route path="/doctor-portal" element={<DoctorPortal />} />
          <Route path="/technician-portal" element={<TechnicianPortal />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <ProfileCompletion />
              </ProtectedRoute>
            }
          />

          {/* ===== AI Healthcare System ===== */}
          <Route path="/ai" element={<HomePage />} />
          <Route path="/ai/services" element={<ServicesPage />} />
          <Route path="/ai/assistant" element={<AIAssistantPage />} />
          <Route path="/ai/consultations" element={<ConsultationsPage />} />
          <Route path="/ai/emergency" element={<EmergencyPage />} />
          <Route path="/ai/pharmacy" element={<PharmacyPage />} />
          <Route path="/ai/monitoring" element={<MonitoringPage />} />
          <Route path="/ai/records" element={<RecordsPage />} />

        </Routes>
      </main>

      <ToastContainer position="bottom-right" />
      <Footer />
    </div>
  )
}

export default App
