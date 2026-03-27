import React, { useState, useEffect } from "react";
import {
  Trash2,
  UserCog,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Lock,
  Unlock,
  Key,
} from "lucide-react";
import "./UsersTable.css";
import { io } from "socket.io-client";

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Employee");

  const [actionLoading, setActionLoading] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const isAdmin = localStorage.getItem("role")?.toLowerCase() === "admin";
  const roles = ["Admin", "Manager", "HR", "IT-support", "Employee"];

  const fetchUsers = async (manual = false) => {
    if (manual) setIsRefreshing(true);

    try {
      const response = await fetch("http://127.0.0.1:5005/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      const sorted = [...data].sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return a.username.localeCompare(b.username);
      });

      setUsers(sorted);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // --- SOCKET.IO FOR ONLINE STATUS ---
  useEffect(() => {
    const socket = io("http://127.0.0.1:5005");

    socket.on("connect", () => {
      if (userId) socket.emit("register_user", userId);
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users.map(String));
    });

    return () => socket.disconnect();
  }, [userId]);

  const statusCheck = (lastLogin) => {
    if (!lastLogin) return "Offline";
    const now = new Date();
    const last = new Date(lastLogin);
    const diffMin = (now - last) / 1000 / 60;
    return diffMin <= 10 ? "Online" : "Offline";
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditRole(user.role);
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const openLockModal = (user) => {
    setSelectedUser(user);
    setShowLockModal(true);
  };

  const updateUser = async () => {
    if (!editUsername.trim()) {
      alert("Username cannot be empty");
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5005/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: editUsername, role: editRole }),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
        setShowEditModal(false);
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Edit error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5005/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserLock = async (user) => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5005/users/${user.id}/lock`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
        setShowLockModal(false);
      }
    } catch (error) {
      console.error("Lock error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerPasswordReset = async (user) => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:5005/users/${user.id}/reset-password`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert("Password reset triggered.");
        setShowResetModal(false);
      }
    } catch (error) {
      console.error("Password reset error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUsername || !newPassword) {
      alert("Username and password required");
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5005/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers((prev) => [...prev, createdUser]);
        setShowCreateModal(false);

        setNewUsername("");
        setNewPassword("");
        setNewRole("Employee");
      } else {
        alert("Failed to create user");
      }
    } catch (error) {
      console.error("Create user error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6">
        <div className="table-header-actions">
          <div className="search-wrapper">
            <Search size={18} color="#94a3b8" />
            <input
              className="search-input"
              placeholder="Find a user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="refresh-btn" onClick={() => fetchUsers(true)}>
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
            {isRefreshing ? "Syncing..." : "Sync Users"}
          </button>

          {isAdmin && (
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              + Create User
            </button>
          )}
        </div>

        <table className="users-table bg-white/20 backdrop-blur-sm rounded-xl shadow-inner p-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Known IP</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user, index) => {
              // --- NEW ONLINE CHECK ---
              const isUserOnline = onlineUsers.some((id) => id.toString() === user.id.toString());

              return (
                <tr key={user.id}>
                  <td>{(index + 1).toString().padStart(2, "0")}</td>

                  <td>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div className="avatar">
                        <span
                          className={`status-dot ${isUserOnline ? "online" : "offline"}`}
                          title={
                            user.is_active === false
                              ? "Disabled"
                              : isUserOnline
                              ? "Online"
                              : "Offline"
                          }
                        ></span>
                        {user.username.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ fontWeight: 700 }}>{user.username}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>ID: #{user.id}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-${user.role.toLowerCase()}`}>
                      {user.role === "Admin" ? <ShieldCheck size={12} /> : <User size={12} />}
                      {user.role}
                    </span>
                  </td>

                  <td>{user.is_active === false ? "Disabled" : isUserOnline ? "Online" : "Offline"}</td>
                  <td style={{ fontFamily: "monospace" }}>{user.last_ip || "Unknown"}</td>

                  <td style={{ textAlign: "right" }}>
                    {isAdmin ? (
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          className="action-icon edit"
                          title="Edit User"
                          disabled={actionLoading}
                          onClick={() => openEditModal(user)}
                        >
                          <UserCog size={18} />
                        </button>

                        <button
                          className="action-icon reset"
                          title="Reset Password"
                          disabled={actionLoading}
                          onClick={() => openResetModal(user)}
                        >
                          <Key size={18} />
                        </button>

                        <button
                          className="action-icon lock-toggle"
                          title={user.is_active ? "Lock Account" : "Unlock Account"}
                          disabled={actionLoading}
                          onClick={() => openLockModal(user)}
                        >
                          {user.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>

                        <button
                          className="action-icon delete"
                          title="Delete User"
                          disabled={actionLoading}
                          onClick={() => openDeleteModal(user)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <span>RESTRICTED</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* MODALS: CREATE, EDIT, DELETE, RESET, LOCK */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6">
              <h3>Create New User</h3>

              <input
                type="text"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />

              <input
                type="password"
                placeholder="Temporary Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button onClick={createUser}>{actionLoading ? "Creating..." : "Create"}</button>
                <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6">
              <h3>Edit User: {selectedUser.username}</h3>

              <input
                type="text"
                placeholder="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />

              <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button onClick={updateUser}>{actionLoading ? "Saving..." : "Save Changes"}</button>
                <button onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete user <strong>{selectedUser.username}</strong>?
              </p>
              <div className="modal-actions">
                <button onClick={confirmDelete}>{actionLoading ? "Deleting..." : "Delete"}</button>
                <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showResetModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6">
              <h3>Reset Password</h3>
              <p>
                Are you sure you want to reset password for <strong>{selectedUser.username}</strong>?
              </p>
              <div className="modal-actions">
                <button onClick={() => triggerPasswordReset(selectedUser)}>
                  {actionLoading ? "Resetting..." : "Reset Password"}
                </button>
                <button onClick={() => setShowResetModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showLockModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6">
              <h3>{selectedUser.is_active ? "Disable User" : "Enable User"}</h3>
              <p>
                Are you sure you want to {selectedUser.is_active ? "disable" : "enable"} user{" "}
                <strong>{selectedUser.username}</strong>?
              </p>
              <div className="modal-actions">
                <button onClick={() => toggleUserLock(selectedUser)}>
                  {actionLoading
                    ? selectedUser.is_active
                      ? "Disabling..."
                      : "Enabling..."
                    : selectedUser.is_active
                    ? "Disable"
                    : "Enable"}
                </button>
                <button onClick={() => setShowLockModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTable;