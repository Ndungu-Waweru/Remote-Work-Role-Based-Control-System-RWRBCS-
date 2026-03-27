import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "3rem", color: "#95a5a6" }}>404 - Page Not Found</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <button 
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          cursor: "pointer",
          backgroundColor: "#2ecc71",
          color: "white",
          border: "none",
          borderRadius: "5px"
        }}
      >
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
