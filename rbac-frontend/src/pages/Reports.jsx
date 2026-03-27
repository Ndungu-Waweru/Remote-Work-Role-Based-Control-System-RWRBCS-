import React, { useEffect } from "react";
import { io } from "socket.io-client"; // ✅ ADDED

function Reports(){

  const userId = localStorage.getItem("userId"); // ✅ ADDED

  useEffect(() => {
    const socket = io("http://127.0.0.1:5005");

    socket.on("connect", () => {
      // ✅ CRITICAL: register user
      if (userId) {
        socket.emit("register_user", userId);
      }
    });

    return () => socket.disconnect();
  }, [userId]);

  return(

    <div>

      <h1>Reports</h1>

      <p>User activity reports will appear here.</p>

    </div>

  )

}

export default Reports;