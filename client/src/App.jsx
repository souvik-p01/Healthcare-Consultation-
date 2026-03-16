// App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

/* -------- Layout Components -------- */
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute"; // Fixed duplicate import

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
import AdminDashboard from "./Pages/AdminDashboard";

/* -------- Error Pages -------- */
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
  
  // Check if current route is auth route (login)
  const isAuthRoute = location.pathname === '/login';
  
  // Check if current route is public (no header/footer needed for some pages)
  const isPublicRoute = isAdminRoute || isAuthRoute;

  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Show header only on non-admin and non-auth routes */}
      {!isPublicRoute && (
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}

      {/* Show AI Navigation only on AI services pages */}
      {location.pathname.startsWith("/services") && !isPublicRoute && <Navigation />}

      <main className="flex-grow">
        <Routes>
          {/* ===== Public Routes ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Service />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginSignUpPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ===== Admin Routes (No Header/Footer) ===== */}
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

          {/* ===== AI Healthcare Services ===== */}
          <Route 
            path="/services/assistant" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "technician", "admin"]}>
                <AIAssistantPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/consultations" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <ConsultationsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/emergency" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "technician", "admin"]}>
                <EmergencyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/pharmacy" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <PharmacyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/monitoring" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "technician", "admin"]}>
                <MonitoringPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/records" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <RecordsPage />
              </ProtectedRoute>
            } 
          />

          {/* ===== Extra Services ===== */}
          <Route 
            path="/services/telemedicine" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "provider", "admin"]}>
                <Telemedicine />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/lab-tests" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "technician", "admin"]}>
                <LabTests />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/health-reports" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <HealthReports />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/services/wellness-programs" 
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                <WellnessPrograms />
              </ProtectedRoute>
            } 
          />

          {/* ===== Redirects ===== */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />

          {/* ===== 404 Route ===== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Show footer only on non-admin, non-auth, and non-service pages */}
      {!isPublicRoute && !location.pathname.startsWith("/services") && <Footer />}

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
      />
    </div>
  );
};

export default App;