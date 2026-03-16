// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, initialLoading } = useAppContext();
  const location = useLocation();

  // ⏳ Loading state - using initialLoading from context
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get user role from user object (assuming it's in user.role)
  const userRole = user.role?.toLowerCase();

  // ✅ Admin can access everything (if admin role exists)
  if (userRole === "admin") {
    return children;
  }

  // ❌ Role not allowed (if allowedRoles is provided and user role not in list)
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Access granted
  return children;
};

export default ProtectedRoute;