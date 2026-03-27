import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // 1. No token? Back to login
  if (!token) {
    console.warn("No token found, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    // Adjust 'role' below if your JWT uses a different key (e.g., 'roles' or 'user_role')
    const userRole = decoded?.role?.toLowerCase() || "";
    const expiration = decoded?.exp;

    console.log("Debug Auth:", { userRole, expiration, allowedRoles });

    // 2. Check if token is expired
    if (expiration && Date.now() >= expiration * 1000) {
      console.error("Token expired.");
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }

    // 3. Admin Bypass: Admins can see everything
    if (userRole === "admin") {
      return children;
    }

    // 4. Role Authorization: 
    // If specific roles are required, check if user has one
    if (allowedRoles.length > 0) {
      const hasAccess = allowedRoles
        .map((r) => r.toLowerCase())
        .includes(userRole);

      if (!hasAccess) {
        console.warn(`Access denied for role: ${userRole}`);
        return <Navigate to="/unauthorized" replace />;
      }
    }

    // 5. Success: Render the AdminLayout (children)
    return children;

  } catch (error) {
    console.error("JWT Decode failed:", error);
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
