// src/pages/Admin.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, ShieldCheck, Key } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000";

function Admin() {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
    totalPermissions: 0
  });

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: ""
  });

  const activityData = [
    { day: "Mon", users: 4 },
    { day: "Tue", users: 7 },
    { day: "Wed", users: 3 },
    { day: "Thu", users: 8 },
    { day: "Fri", users: 5 },
    { day: "Sat", users: 2 },
    { day: "Sun", users: 6 }
  ];

  // ---------------- FETCH DATA ----------------

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setRoles(data.roles || data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {

    if (!token) navigate("/");

    fetchStats();
    fetchUsers();
    fetchRoles();
    fetchAuditLogs();

  }, []);

  // ---------------- ACTIONS ----------------

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const updateUserRole = async (id, role) => {

    try {

      await fetch(`${API_URL}/users/${id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      fetchUsers();

    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {

    if (!window.confirm("Delete user?")) return;

    try {

      await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchUsers();
      fetchStats();

    } catch (err) {
      console.error(err);
    }
  };

  const createUser = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        fetchUsers();
        fetchStats();
        setNewUser({ username: "", password: "", role: "" });
      }

    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- FILTERS ----------------

  const filteredUsers = users.filter(
    (u) =>
      (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRoles = roles.filter((r) =>
    (r.name || "").toLowerCase().includes(roleSearch.toLowerCase())
  );

  // ---------------- DASHBOARD ----------------

  const DashboardSection = () => (

    <div>

      <h2>Admin Dashboard</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"20px"}}>

        <div style={{background:"#fff",padding:"20px",cursor:"pointer"}} onClick={()=>setActiveSection("users")}>
          <Users size={28}/>
          <h3>{stats.totalUsers}</h3>
          <p>Total Users</p>
        </div>

        <div style={{background:"#fff",padding:"20px",cursor:"pointer"}} onClick={()=>setActiveSection("roles")}>
          <ShieldCheck size={28}/>
          <h3>{stats.totalRoles}</h3>
          <p>Active Roles</p>
        </div>

        <div style={{background:"#fff",padding:"20px",cursor:"pointer"}} onClick={()=>setActiveSection("permissions")}>
          <Key size={28}/>
          <h3>{stats.totalPermissions}</h3>
          <p>Permissions</p>
        </div>

      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"20px",marginTop:"30px"}}>

        <div style={{background:"#fff",padding:"20px"}}>
          <h3>User Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <XAxis dataKey="day"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="users" fill="#3b82f6"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:"#fff",padding:"20px"}}>
          <h3>Recent Audit Logs</h3>

          <table width="100%">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {auditLogs.slice(0,5).map((log,i)=>(
                <tr key={i}>
                  <td>{log.username}</td>
                  <td>{log.action}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        <div style={{background:"#fff",padding:"20px"}}>
          <h3>System Health</h3>
          <p>🟢 API Connected</p>
          <p>🟢 Database Active</p>
          <button onClick={fetchStats}>Refresh</button>
        </div>

      </div>

    </div>
  );

  // ---------------- USERS ----------------

  const UsersSection = () => (

    <div>

      <h2>Users</h2>

      <input
        placeholder="Search users"
        value={userSearch}
        onChange={(e)=>setUserSearch(e.target.value)}
      />

      <table width="100%">

        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredUsers.map((u)=>(
            <tr key={u.id}>

              <td>{u.username}</td>

              <td>
                <select
                  value={u.role}
                  onChange={(e)=>updateUserRole(u.id,e.target.value)}
                >
                  {roles.map((r)=>(
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <button onClick={()=>deleteUser(u.id)}>Delete</button>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );

  // ---------------- ROLES ----------------

  const RolesSection = () => (

    <div>

      <h2>Roles</h2>

      <input
        placeholder="Search roles"
        value={roleSearch}
        onChange={(e)=>setRoleSearch(e.target.value)}
      />

      <ul>

        {filteredRoles.map((r)=>(
          <li key={r.id}>{r.name}</li>
        ))}

      </ul>

    </div>
  );

  // ---------------- PERMISSIONS ----------------

  const PermissionsSection = () => (
    <div>
      <h2>Permissions</h2>
      <p>Permissions are assigned to roles in the RBAC system.</p>
    </div>
  );

  // ---------------- MAIN ----------------

  return (

  <div className="admin-layout">

    <Sidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      logout={logout}
    />

    <div className="admin-main">

      {activeSection === "dashboard" && <DashboardSection />}
      {activeSection === "users" && <UsersSection />}
      {activeSection === "roles" && <RolesSection />}
      {activeSection === "permissions" && <PermissionsSection />}

    </div>

  </div>

);

}

export default Admin;