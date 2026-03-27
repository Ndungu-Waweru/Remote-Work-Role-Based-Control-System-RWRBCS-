// PermissionRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

// Define role → permissions mapping
const rolePermissionsMap = {
  admin: ["create_user","delete_user","update_user","view_reports","manage_roles","manage_permissions"],
  manager: ["assign_task","create_team_task","manage_team_tasks","view_reports"],
  it_support: ["backup","reset_passwords","view_system_logs","view_reports"],
  hr: ["create_user","update_user","view_reports"],
  employee: ["view_my_tasks","upload_task","edit_task","view_task_results"],
};

const PermissionRoute = ({ children, requiredPermissions = [] }) => {
  try {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    console.log("PermissionRoute:", { token, role, requiredPermissions });

    // 1. Not logged in → redirect to login
    if (!token) return <Navigate to="/" replace />;

    // 2. Invalid or missing role → redirect to Unauthorized
    if (!role || !rolePermissionsMap[role]) {
      console.warn("PermissionRoute: Invalid role", role);
      return <Navigate to="/unauthorized" replace />;
    }

    // 3. Admin bypass → always allow
    if (role === "admin") return children;

    const userPermissions = rolePermissionsMap[role];

    // 4. Check required permissions
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      console.warn(`PermissionRoute: Access denied for ${role}. Missing:`, requiredPermissions);
      return <Navigate to="/unauthorized" replace />;
    }

    // 5. All checks passed → render children
    return children;

  } catch (error) {
    console.error("PermissionRoute unexpected error:", error);
    return <Navigate to="/unauthorized" replace />;
  }
};

export default PermissionRoute;