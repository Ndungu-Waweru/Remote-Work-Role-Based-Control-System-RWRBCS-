import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Activity, History, Search, Bell, RefreshCw } from "lucide-react";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { io } from "socket.io-client"; // ✅ ADDED

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [connected, setConnected] = useState(true);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Waweru";
  const userRole = localStorage.getItem("role")?.toLowerCase() || "employee";
  const isAdmin = userRole === 'admin';

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const response = await fetch("http://127.0.0.1:5005/dashboard-stats", {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const result = await response.json();
      setData(result);
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError("Backend connection failed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboard();
      const interval = setInterval(() => fetchDashboard(), 30000);
      return () => clearInterval(interval);
    } else {
      navigate("/login");
    }
  }, [token, navigate, fetchDashboard]);

  // ✅ SOCKET.IO (ADDED ONLY)
  useEffect(() => {
    const socket = io("http://127.0.0.1:5005");

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("system_metrics", (metrics) => {
      setData(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          cpuUsage: metrics.cpu,
          ramUsage: metrics.ram
        }
      } : prev);
    });

    socket.on("new_audit_log", (log) => {
      setData(prev => prev ? {
        ...prev,
        recentLogs: [log, ...(prev.recentLogs || [])].slice(0, 10)
      } : prev);
    });

    return () => socket.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/admin/users?search=${searchQuery}`);
  };

  const exportLogsToCSV = () => {
    if (!data?.recentLogs) return;
    const headers = ["ID", "Admin", "Action", "Target User", "Timestamp"];
    const rows = data.recentLogs.map(log => [
      log.id,
      log.admin || "System",
      log.action,
      log.target_user || "N/A",
      new Date(log.timestamp).toLocaleString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getBadgeStyle = (action) => {
    const act = action.toLowerCase();
    if (act.includes('registered')) return "bg-emerald-500/20 text-emerald-400";
    if (act.includes('login')) return "bg-blue-500/20 text-blue-400";
    return "bg-slate-500/20 text-slate-300";
  };

  if (loading) return <div className="text-center text-slate-400 mt-20">Loading Dashboard...</div>;
  if (error) return <div className="text-center text-red-400 mt-20">{error}</div>;

  const doughnutData = {
    labels: data?.roleDistribution?.map(r => r.label) || [],
    datasets: [{
      data: data?.roleDistribution?.map(r => r.value) || [],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#64748b', '#8b5cf6'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] to-[#0f172a] p-6 md:p-10 text-slate-100">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">

        <div>
          <h1 className="text-3xl font-bold">Welcome, {username}</h1>

          <div className="flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></span>
            <p className="text-sm text-slate-400">
              {connected ? "Connected" : "Offline"} • {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </form>

          <button
            onClick={() => fetchDashboard(true)}
            className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw size={18} />
          </button>

          <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* CARDS */}
      <div className="grid md:grid-cols-3 gap-6">

        <div onClick={() => navigate("/admin/users")}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition">

          <div className="bg-blue-600 p-3 rounded-full"><Users size={18} /></div>
          <div>
            <p className="text-2xl font-bold">{data?.stats?.userCount || 0}</p>
            <p className="text-xs text-slate-400">TOTAL USERS</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-3 rounded-full"><Activity size={18} /></div>
            <div className="flex-1">
              <p className="text-emerald-400 font-semibold">System Healthy</p>

              {isAdmin && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between"><span>CPU</span><span>{data?.stats?.cpuUsage || 0}%</span></div>
                  <div className="h-2 bg-slate-800 rounded"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${data?.stats?.cpuUsage}%` }} /></div>

                  <div className="flex justify-between"><span>RAM</span><span>{data?.stats?.ramUsage || 0}%</span></div>
                  <div className="h-2 bg-slate-800 rounded"><div className="h-2 bg-blue-500 rounded" style={{ width: `${data?.stats?.ramUsage}%` }} /></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div onClick={() => navigate("/admin/audit-logs")}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition">

            <div className="bg-red-600 p-3 rounded-full"><History size={18} /></div>
            <div>
              <p className="text-2xl font-bold">{data?.stats?.logCount || 0}</p>
              <p className="text-xs text-slate-400">AUDIT LOGS</p>
            </div>
          </div>
        )}
      </div>

      {/* CHART */}
      <div className="mt-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <h3 className="text-xs text-slate-400 mb-4">ROLE DISTRIBUTION</h3>
        <div className="h-60">
          <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      {/* TABLE */}
      {isAdmin && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg">

          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="text-sm text-slate-400">RECENT LOGS</h3>
            <button onClick={exportLogsToCSV} className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg">
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur text-slate-300">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Admin</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLogs.map((log, i) => (
                  <tr key={log.id} className="border-t border-white/5 hover:bg-white/10 transition">
                    <td className="px-4 py-2">{log.id}</td>
                    <td className="px-4 py-2">{log.admin || "System"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${getBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2">{log.target_user || "N/A"}</td>
                    <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}

export default Dashboard;