import React, { useState } from "react";

// Use the same mapping structure from your PermissionRoute.jsx
const initialRolePermissions = {
  admin: ["create_user", "delete_user", "update_user", "view_reports", "manage_roles", "manage_permissions"],
  manager: ["assign_task", "create_team_task", "manage_team_tasks", "view_reports"],
  it_support: ["backup", "reset_passwords", "view_system_logs", "view_reports"],
  hr: ["create_user", "update_user", "view_reports"],
  employee: ["view_my_tasks", "upload_task", "edit_task", "view_task_results"],
};

// All available unique permissions across the system
const ALL_AVAILABLE_PERMISSIONS = [
  "create_user", "delete_user", "update_user", "view_reports", 
  "manage_roles", "manage_permissions", "assign_task", 
  "create_team_task", "manage_team_tasks", "backup", 
  "reset_passwords", "view_system_logs", "view_my_tasks", 
  "upload_task", "edit_task", "view_task_results"
];

const Permissions = () => {
  const [roleData, setRoleData] = useState(initialRolePermissions);

  const togglePermission = (role, permission) => {
    setRoleData(prev => {
      const currentPermissions = prev[role];
      const newPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter(p => p !== permission) // Remove if exists
        : [...currentPermissions, permission]; // Add if missing
      
      return { ...prev, [role]: newPermissions };
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans text-slate-100 bg-gradient-to-b from-[#0a0a23] to-[#020617] selection:bg-indigo-500/30">
      <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl p-6">
        <h1 className="text-3xl font-bold mb-2">System Permissions Matrix</h1>
        <p className="text-slate-400 mb-6">Manage which roles have access to specific system features.</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 bg-slate-800/80 backdrop-blur-md z-10">
              <tr>
                <th style={styles.th}>Permission</th>
                {Object.keys(roleData).map(role => (
                  <th key={role} style={styles.th}>{role.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_AVAILABLE_PERMISSIONS.map((perm, idx) => (
                <tr
                  key={perm}
                  className={`transition-colors ${
                    idx % 2 === 0 ? "bg-slate-800/20" : "bg-slate-800/10"
                  } hover:bg-slate-700/50`}
                >
                  <td style={styles.td}><strong>{perm.replace(/_/g, ' ')}</strong></td>
                  {Object.keys(roleData).map(role => (
                    <td
                      key={`${role}-${perm}`}
                      style={{
                        ...styles.td,
                        backgroundColor:
                          role === "admin"
                            ? "rgba(147, 197, 253, 0.1)"
                            : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={roleData[role].includes(perm)}
                        disabled={role === 'admin'} // Typically, admin is immutable
                        onChange={() => togglePermission(role, perm)}
                        className={`cursor-pointer ${role === 'admin' ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button 
          onClick={() => console.log("Updated Config:", roleData)}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const styles = {
  th: { padding: "12px", borderBottom: "2px solid #4b5563" },
  td: { padding: "10px", borderBottom: "1px solid #374151" },
};

export default Permissions;