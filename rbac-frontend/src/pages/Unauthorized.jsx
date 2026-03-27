import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "3rem", color: "#e74c3c" }}>403 - Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      <button 
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          cursor: "pointer",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "5px"
        }}
      >
        Back to Login
      </button>
    </div>
  );
};

export default Unauthorized;
