import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts & Guards
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Monitoring from "./pages/Monitoring";
import ApiKeys from "./pages/ApiKeys";
import Reports from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. ROOT REDIRECT: Fixes blank page on http://localhost:3000/ */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 2. PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 3. UNAUTHORIZED PAGE: Fixes blank page if role check fails */}
        <Route 
          path="/unauthorized" 
          element={
            <div style={{ textAlign: "center", padding: "50px" }}>
              <h1>403 - Access Denied</h1>
              <p>You do not have permission to view this page.</p>
              <button onClick={() => window.location.href = "/login"}>Back to Login</button>
            </div>
          } 
        />

        {/* 4. PROTECTED ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested Routes inside AdminLayout's <Outlet /> */}
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* 5. CATCH-ALL: Redirects any typos or broken links to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
