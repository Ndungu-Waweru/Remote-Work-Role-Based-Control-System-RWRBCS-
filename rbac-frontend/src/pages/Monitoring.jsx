import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { io } from "socket.io-client";
import "./monitoring.css"; 

// --- Styled Components ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-2xl transition-all">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.stroke }} />
              <p className="text-sm font-semibold text-slate-100">
                {p.name}: <span className="text-indigo-300">{p.value}%</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const StatusCard = ({ label, status }) => (
  <div className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-sm">
    <div className={`w-2.5 h-2.5 rounded-full status-pulse ${status === 'Online' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'}`} />
    <span className="text-xs font-semibold tracking-wide text-slate-300">
      {label}: <span className={status === 'Online' ? 'text-emerald-400' : 'text-rose-400'}>{status.toUpperCase()}</span>
    </span>
  </div>
);

const MetricCard = ({ label, value, trend, data, color }) => {
  const isUp = trend === "up";
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-1 min-w-[140px] hover:border-slate-700 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-tight">{label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isUp ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {isUp ? '↑' : '↓'}
        </span>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-slate-100">{value}</span>
        <span className="text-slate-500 text-xs font-medium">%</span>
      </div>
      <div className="h-12 w-full opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey={label} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Main Component ---

function Monitoring() {
  const [data, setData] = useState([
    { time: "12:00", CPU: 20, RAM: 35, Network: 10, Disk: 25 },
    { time: "12:05", CPU: 35, RAM: 45, Network: 15, Disk: 30 },
    { time: "12:10", CPU: 25, RAM: 30, Network: 12, Disk: 28 },
  ]);

  const [status, setStatus] = useState({ api: "Online", db: "Online" });
  const [alerts, setAlerts] = useState([]);
  const [latency, setLatency] = useState(120);
  const [errors, setErrors] = useState(0);
  const [timeRange, setTimeRange] = useState("30m");

  const trends = useMemo(() => {
    if (data.length < 2) return { CPU: "stable", RAM: "stable", Network: "stable", Disk: "stable" };
    const prev = data[data.length - 2];
    const curr = data[data.length - 1];
    const getTrend = (c, p) => (c > p ? "up" : c < p ? "down" : "stable");
    return {
      CPU: getTrend(curr.CPU, prev.CPU),
      RAM: getTrend(curr.RAM, prev.RAM),
      Network: getTrend(curr.Network, prev.Network),
      Disk: getTrend(curr.Disk, prev.Disk)
    };
  }, [data]);

  const healthStatus = useMemo(() => {
    const last = data[data.length - 1];
    const maxLoad = Math.max(last?.CPU || 0, last?.RAM || 0);
    if (maxLoad > 90) return "critical";
    if (maxLoad > 70) return "warning";
    return "healthy";
  }, [data]);

  const updateDashboard = () => {
    const apiOnline = Math.random() > 0.05;
    setStatus({ api: apiOnline ? "Online" : "Offline", db: "Online" });

    const newDataPoint = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      CPU: Math.floor(Math.random() * 80) + 10,
      RAM: Math.floor(Math.random() * 80) + 10,
      Network: Math.floor(Math.random() * 50),
      Disk: Math.floor(Math.random() * 60),
    };

    setLatency(Math.floor(Math.random() * 200) + 50);
    if (Math.random() > 0.85) setErrors(prev => prev + 1);

    if (newDataPoint.CPU > 85) {
      setAlerts(prev => [{ message: "⚠️ CPU usage above 85%", time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    }
    setData(prev => [...prev, newDataPoint].slice(-12));
  };

  useEffect(() => {
    let interval;
    const startMonitoring = () => { updateDashboard(); interval = setInterval(updateDashboard, 30000); };
    const stopMonitoring = () => { if (interval) clearInterval(interval); };
    const handleVisibility = () => document.visibilityState === "visible" ? startMonitoring() : stopMonitoring();
    
    document.addEventListener("visibilitychange", handleVisibility);
    startMonitoring();
    return () => { stopMonitoring(); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);

  useEffect(() => {
    const socket = io("http://127.0.0.1:5005", { transports: ["websocket"] });
    socket.on("system_metrics", metric => {
      setData(prev => [...prev, {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        CPU: metric.cpu, RAM: metric.ram, Network: metric.network, Disk: metric.disk
      }].slice(-12));
    });
    return () => socket.disconnect();
  }, []);

  const exportMetrics = () => {
    const csv = [["Time", "CPU", "RAM", "Network", "Disk"], ...data.map(d => [d.time, d.CPU, d.RAM, d.Network, d.Disk])]
      .map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `metrics_${new Date().getTime()}.csv`;
    link.click();
  };

  const lastData = data[data.length - 1] || { CPU: 0, RAM: 0, Network: 0, Disk: 0 };

  return (
    <div className="monitoring-container min-h-screen bg-[#020617] text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-1">System Monitoring</h1>
            <p className="text-slate-500 font-medium italic">Infrastructure Health Dashboard v2.0</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusCard label="API" status={status.api} />
            <StatusCard label="DB" status={status.db} />
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/30 p-2 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
          <div className="flex gap-1">
            {["5m", "30m", "1h"].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${timeRange === r ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200"}`}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={exportMetrics} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-5 py-2 rounded-xl transition-colors border border-slate-700/50">
            EXPORT CSV
          </button>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="CPU" value={lastData.CPU} trend={trends.CPU} data={data} color="#6366f1" />
          <MetricCard label="RAM" value={lastData.RAM} trend={trends.RAM} data={data} color="#10b981" />
          <MetricCard label="Network" value={lastData.Network} trend={trends.Network} data={data} color="#f59e0b" />
          <MetricCard label="Disk" value={lastData.Disk} trend={trends.Disk} data={data} color="#8b5cf6" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Container */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Resource Distribution</h3>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> CPU</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> RAM</span>
              </div>
            </div>
            
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="CPU" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="RAM" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">System Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-400">Status</span>
                  <span className={healthStatus === "healthy" ? "text-emerald-400" : healthStatus === "warning" ? "text-yellow-400" : "text-rose-400"}>
                    {healthStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-400">Latency</span>
                  <span className="text-indigo-400">{latency}ms</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-400">Total Errors</span>
                  <span className="text-rose-400">{errors}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 backdrop-blur-sm h-[260px] flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Live Alerts</h3>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.length > 0 ? alerts.map((alert, i) => (
                  <div key={i} className="text-[11px] font-medium bg-slate-800/50 border border-slate-700/30 p-3 rounded-xl flex justify-between gap-3 items-start animate-in fade-in slide-in-from-right-2 duration-300">
                    <span className="text-slate-200 leading-relaxed">{alert.message}</span>
                    <span className="text-slate-500 whitespace-nowrap">{alert.time}</span>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-[11px] font-bold uppercase italic tracking-tighter">
                    No active threats
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
