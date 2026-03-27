import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const API_URL = "http://127.0.0.1:5005";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format payload to match backend expectations exactly
      const userData = {
        username: username.trim(),
        password: password,
        role: role.toLowerCase() // 'it_support' instead of 'IT Support'
      };

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error from backend (e.g. "Username already exists")
        alert(data.message || "Registration failed");
        return;
      }

      alert("User registered successfully!");
      navigate("/login"); // Redirect to your login route
      
    } catch (err) {
      console.error("Connection error:", err);
      alert("Cannot connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/login")}>
          Remote Work Role Based Control System
        </div>
        <div className="nav-links">
          <button onClick={() => navigate("/login")}>Back to Login</button>
        </div>
      </nav>

      <div className="main-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Create Account</h2>
            <p className="subtitle">Join the team to get started</p>
          </div>

          <form onSubmit={handleRegister} className="login-form">
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="role">Your Role</label>
              <div className="input-wrapper">
                <select
                  id="role"
                  className="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="it_support">IT Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Register"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Already have an account?{" "}
              <button
                className="reg-link-btn"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
