import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

/* -------- Layout Components -------- */
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";

/* -------- Pages -------- */
import Home from "./Pages/Home";
import About from "./Pages/About";
import Service from "./Pages/Service";
import Contact from "./Pages/Contact";
import LoginSignUpPage from "./Pages/LoginSignUpPage";
import Dashboard from "./Pages/Dashboard";
import ProfileCompletion from "./Pages/ProfileCompletion";

/* -------- Portals -------- */
import PatientPortal from "./Pages/PatientPortal";
import DoctorPortal from "./Pages/DoctorPortal";
import TechnicianPortal from "./Pages/TechnicianPortal";

/* -------- AI Healthcare Pages -------- */
import AIAssistantPage from "./Pages/AIAssistantPage";
import ConsultationsPage from "./Pages/ConsultationsPage";
import EmergencyPage from "./Pages/EmergencyPage";
import PharmacyPage from "./Pages/PharmacyPage";
import MonitoringPage from "./Pages/MonitoringPage";
import RecordsPage from "./Pages/RecordsPage";

/* -------- Services -------- */
import Telemedicine from "./Pages/services/Telemedicine";
import LabTests from "./Pages/services/LabTests";
import HealthReports from "./Pages/services/HealthReports";
import WellnessPrograms from "./Pages/services/WellnessPrograms";

/* -------- Admin Dashboard -------- */
import AdminDashboard from "./components/AdminDashboard";


/* -------- Extra -------- */
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center text-center bg-gray-50">
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-bold text-red-600 mb-2">Unauthorized Access</h1>
      <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
      <button 
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center text-center bg-gray-50">
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  </div>
);

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Show header only on non-admin routes */}
      {!isAdminRoute && (
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}

      {/* Show AI Navigation only on AI pages */}
      {location.pathname.startsWith("/services") && <Navigation />}

      <main className="flex-grow">
        <Routes>
          {/* ===== Public Routes ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Service />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginSignUpPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ===== Admin Routes ===== */}
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* ===== Protected Common Routes ===== */}
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

          {/* ===== Role-Based Portals ===== */}
          <Route
            path="/patient-portal"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientPortal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor-portal"
            element={
              <ProtectedRoute allowedRoles={["doctor", "nurse", "provider"]}>
                <DoctorPortal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/technician-portal"
            element={
              <ProtectedRoute allowedRoles={["technician", "staff"]}>
                <TechnicianPortal />
              </ProtectedRoute>
            }
          />

          {/* ===== AI Healthcare ===== */}
          <Route 
            path="/services/assistant" 
            element={
              <ProtectedRoute>
                <AIAssistantPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/consultations" 
            element={
              <ProtectedRoute>
                <ConsultationsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/emergency" 
            element={
              <ProtectedRoute>
                <EmergencyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/pharmacy" 
            element={
              <ProtectedRoute>
                <PharmacyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/monitoring" 
            element={
              <ProtectedRoute>
                <MonitoringPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/records" 
            element={
              <ProtectedRoute>
                <RecordsPage />
              </ProtectedRoute>
            } 
          />

          {/* ===== Extra Services ===== */}
          <Route 
            path="/services/telemedicine" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "provider"]}>
                <Telemedicine />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/lab-tests" 
            element={
              <ProtectedRoute>
                <LabTests />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/health-reports" 
            element={
              <ProtectedRoute>
                <HealthReports />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/wellness-programs" 
            element={
              <ProtectedRoute>
                <WellnessPrograms />
              </ProtectedRoute>
            } 
          />

          {/* ===== Redirects ===== */}
          <Route path="/admin" element={<Navigate to="/admin/" replace />} />

          {/* ===== 404 Route ===== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Show footer only on non-admin routes */}
      {!isAdminRoute && <Footer />}

      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default App;