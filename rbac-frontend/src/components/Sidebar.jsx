import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, ShieldCheck, FileText, 
  Settings, Activity, Key, History, Lock, LogOut, Menu, X, UserCircle 
} from "lucide-react";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const rawRole = localStorage.getItem("role") || "employee";
  const role = rawRole.toLowerCase();

  const STORAGE_KEY = "user_app_settings";
  const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const username = savedSettings.username || "User";
  const profileImage = savedSettings.profileImage;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const allMenuItems = [
    { label: "Dashboard", path: "/admin", roles: ["admin", "manager", "hr", "it_support", "employee"], icon: <LayoutDashboard size={20} /> },
    { label: "Users", path: "/admin/users", roles: ["admin", "manager"], icon: <Users size={20} /> },
    { label: "Roles", path: "/admin/roles", roles: ["admin"], icon: <ShieldCheck size={20} /> },
    { label: "Permissions", path: "/admin/permissions", roles: ["admin"], icon: <Lock size={20} /> },
    { label: "Reports", path: "/admin/reports", roles: ["admin", "hr"], icon: <FileText size={20} /> },
    { label: "Monitoring", path: "/admin/monitoring", roles: ["admin", "it_support"], icon: <Activity size={20} /> },
    { label: "API Keys", path: "/admin/api-keys", roles: ["admin", "it_support"], icon: <Key size={20} /> },
    { label: "Audit Logs", path: "/admin/audit-logs", roles: ["admin"], icon: <History size={20} /> },
    { label: "Settings", path: "/admin/settings", roles: ["admin"], icon: <Settings size={20} /> },
  ];

  const visibleMenuItems = allMenuItems
    .filter(item => item.roles.includes(role))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <aside className={`flex flex-col h-screen transition-width duration-300 overflow-hidden shadow-md ${collapsed ? "w-20" : "w-72"} bg-[#0f172a] text-gray-200`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-20 border-b border-gray-700">
        <Link to="/admin" className="flex flex-col">
          {!collapsed ? (
            <h2 className="text-white font-extrabold text-base uppercase leading-tight">
              Remote Work <br /> 
              <span className="text-indigo-400 text-xs">Role-Based Control System</span>
            </h2>
          ) : (
            <h2 className="text-indigo-400 font-extrabold text-lg">RW</h2>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-gray-200 flex items-center justify-center hover:text-white transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* User Profile */}
      <Link
        to="/admin/settings"
        className="flex items-center px-5 py-4 border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden"
      >
        <div className="flex justify-center min-w-[32px]">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className={`rounded-full object-cover ${collapsed ? "w-9 h-9" : "w-12 h-12"}`}
            />
          ) : (
            <UserCircle size={collapsed ? 36 : 48} color="#60a5fa" />
          )}
        </div>
        {!collapsed && (
          <div className="ml-3 flex flex-col whitespace-nowrap">
            <span className="text-white text-sm font-semibold capitalize">{username}</span>
            <span className="text-gray-400 text-xs uppercase tracking-wide">{role}</span>
          </div>
        )}
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-3 rounded-lg h-12 transition-all ${
              location.pathname === item.path
                ? "bg-indigo-500 text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            title={collapsed ? item.label : ""}
          >
            <span className="flex items-center justify-center min-w-[24px]">{item.icon}</span>
            {!collapsed && <span className="ml-3">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="px-5 py-4">
        <button
          className="flex items-center w-full px-3 py-3 border border-red-400 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"
          onClick={handleLogout}
        >
          <span className="flex items-center justify-center min-w-[24px]"><LogOut size={20} /></span>
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;