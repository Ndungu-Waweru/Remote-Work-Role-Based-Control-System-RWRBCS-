import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Save, ShieldCheck, Search, RotateCcw, CheckSquare, Square, Clock, FileSpreadsheet, Power, PowerOff } from "lucide-react";
import "./roles.css";

const initialRoles = [
  { name: "Admin", color: "#d93025", permissions: ["Read", "Write", "Delete"], lastModified: new Date().toLocaleString(), isActive: true },
  { name: "Manager", color: "#007bff", permissions: ["Read", "Write"], lastModified: new Date().toLocaleString(), isActive: true },
  { name: "Employee", color: "#28a745", permissions: ["Read"], lastModified: new Date().toLocaleString(), isActive: true },
  { name: "HR", color: "#6f42c1", permissions: ["Read", "Write"], lastModified: new Date().toLocaleString(), isActive: true },
  { name: "IT Support", color: "#fd7e14", permissions: ["Read", "Write"], lastModified: new Date().toLocaleString(), isActive: true }
];

const availablePermissions = ["Read", "Write", "Delete"];

function Roles() {
  const STORAGE_KEY = "app_roles_permissions_v8";

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialRoles;
  });

  const [newRole, setNewRole] = useState("");
  const [newColor, setNewColor] = useState("#007bff");
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editRole, setEditRole] = useState({ name: "", color: "", permissions: [], isActive: true });
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const handleAddRole = () => {
    if (newRole.trim() && !roles.some(r => r.name.toLowerCase() === newRole.trim().toLowerCase())) {
      setRoles([...roles, { 
        name: newRole.trim(), 
        color: newColor, 
        permissions: ["Read"], 
        lastModified: new Date().toLocaleString(),
        isActive: true
      }]);
      setNewRole("");
    }
  };

  const toggleStatus = (index) => {
    const updatedRoles = [...roles];
    updatedRoles[index].isActive = !updatedRoles[index].isActive;
    updatedRoles[index].lastModified = new Date().toLocaleString();
    setRoles(updatedRoles);
  };

  const togglePermission = (index, perm) => {
    const updatedRoles = [...roles];
    const currentPerms = updatedRoles[index].permissions;
    updatedRoles[index].permissions = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];
    updatedRoles[index].lastModified = new Date().toLocaleString();
    setRoles(updatedRoles);
  };

  const handleUpdateRole = () => {
    const updatedRoles = [...roles];
    updatedRoles[editIndex] = { ...editRole, lastModified: new Date().toLocaleString() };
    setRoles(updatedRoles);
    setEditIndex(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all roles to default?")) {
      setRoles(initialRoles.map(r => ({ ...r, lastModified: new Date().toLocaleString() })));
      setSelectedRoles([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRoles.length === filteredRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(filteredRoles.map(r => r.name));
    }
  };

  const toggleSelectRole = (name) => {
    setSelectedRoles(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedRoles.length} selected roles?`)) {
      setRoles(roles.filter(r => !selectedRoles.includes(r.name)));
      setSelectedRoles([]);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Role Name", "Status", "Permissions", "Last Modified"];
    const rows = roles.map(role => [
      role.name,
      role.isActive ? "Active" : "Inactive",
      role.permissions.join("|"),
      role.lastModified
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "roles_permissions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="roles-container">
      <div className="roles-header">
        <div className="title-row">
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <h1><ShieldCheck size={28} /> Roles & Permissions</h1>
            <button className="reset-btn" onClick={handleResetDefaults}><RotateCcw size={14} /> Reset</button>
            <button className="export-csv-btn" onClick={handleExportCSV}><FileSpreadsheet size={16} /> Export CSV</button>
          </div>
          {selectedRoles.length > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedRoles.length} selected</span>
              <button className="delete-btn-sm" onClick={handleBulkDelete}><Trash2 size={14} /> Delete Selected</button>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search roles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="add-role">
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="color-picker-input" />
            <input type="text" placeholder="New Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
            <button onClick={handleAddRole}><Plus size={16} /> Add</button>
          </div>
        </div>
      </div>

      <table className="roles-table">
        <thead>
          <tr>
            <th style={{ width: "40px" }}>
              <button className="icon-btn" onClick={toggleSelectAll}>
                {selectedRoles.length === filteredRoles.length && filteredRoles.length > 0 ? <CheckSquare size={18} color="var(--primary-color)" /> : <Square size={18} />}
              </button>
            </th>
            <th>Role Name</th>
            <th>Status</th>
            <th>Permissions</th>
            <th>Last Modified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRoles.map((role) => {
            const originalIndex = roles.findIndex(r => r.name === role.name);
            const isSelected = selectedRoles.includes(role.name);
            return (
              <tr key={role.name} className={`${isSelected ? "selected-row" : ""} ${!role.isActive ? "inactive-row" : ""}`}>
                <td>
                  <button className="icon-btn" onClick={() => toggleSelectRole(role.name)}>
                    {isSelected ? <CheckSquare size={18} color="var(--primary-color)" /> : <Square size={18} />}
                  </button>
                </td>
                <td>
                  <div className="role-name-cell">
                    <div className="role-badge" style={{ backgroundColor: role.color }}>{role.name.charAt(0)}</div>
                    {editIndex === originalIndex ? (
                      <input value={editRole.name} onChange={(e) => setEditRole({...editRole, name: e.target.value})} className="edit-input" />
                    ) : (
                      <span className="role-label" style={{ color: role.color }}>{role.name}</span>
                    )}
                  </div>
                </td>
                <td>
                   <button 
                    className={`status-toggle ${role.isActive ? "active" : "inactive"}`}
                    onClick={() => toggleStatus(originalIndex)}
                    title={role.isActive ? "Deactivate Role" : "Activate Role"}
                   >
                    {role.isActive ? <Power size={14} /> : <PowerOff size={14} />}
                    {role.isActive ? "Active" : "Inactive"}
                   </button>
                </td>
                <td>
                  <div className="permissions-group">
                    {availablePermissions.map(perm => (
                      <label key={perm} className="perm-checkbox">
                        <input type="checkbox" checked={role.permissions.includes(perm)} onChange={() => togglePermission(originalIndex, perm)} disabled={!role.isActive} />
                        <span>{perm}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td><div className="timestamp-cell"><Clock size={12} /><span>{role.lastModified}</span></div></td>
                <td>
                  <div className="action-buttons">
                    {editIndex === originalIndex ? (
                      <button className="save-btn-table" onClick={handleUpdateRole}><Save size={16} /></button>
                    ) : (
                      <>
                        <button onClick={() => { setEditIndex(originalIndex); setEditRole(role); }}><Edit size={16} /></button>
                        <button onClick={() => setRoles(roles.filter((_, idx) => idx !== originalIndex))}><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Roles;
