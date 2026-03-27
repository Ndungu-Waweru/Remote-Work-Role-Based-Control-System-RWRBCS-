import { useState } from "react";
import { useNavigate } from "react-router-dom";
// FIX: Use named import { jwtDecode } instead of default import
import { jwtDecode } from "jwt-decode"; 
import "../index.css";

const API_URL = "http://127.0.0.1:5005";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const redirectByRole = (role) => {
    const routes = {
      admin: "/admin",
      manager: "/manager",
      hr: "/hr",
      it_support: "/it-support",
    };
    navigate(routes[role] || "/employee");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Invalid username or password");
        return;
      }

      // Safety check: ensure token exists before decoding
      if (data.token) {
        const decoded = jwtDecode(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", decoded.role);
        redirectByRole(decoded.role);
      } else {
        alert("No token received from server");
      }

    } catch (err) {
      console.error("Login error:", err);
      alert("Cannot connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="main-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Login</h2>
            <p>Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
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
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Login"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <button
                className="reg-link-btn"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;