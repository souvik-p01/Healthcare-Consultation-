import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading } = useAppContext();
  const location = useLocation();

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // ❌ Not logged in
  if (!user || !userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = userRole.toLowerCase();

  // ✅ Admin can access everything
  if (role === "admin") {
    return children;
  }

  // ❌ Role not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Access granted
  return children;
};

export default ProtectedRoute;
