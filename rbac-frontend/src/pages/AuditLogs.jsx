import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });

  const [filters, setFilters] = useState({
    admin: "",
    action: "",
    target_user: "",
  });

  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });

  const logsPerPage = 10;

  // ✅ WebSocket connection
  useEffect(() => {
    const socket = io("http://127.0.0.1:5005");

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    // ✅ Listen for new logs
    socket.on("new_audit_log", (newLog) => {
      setLogs((prevLogs) => [newLog, ...prevLogs]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ✅ Initial fetch (kept)
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:5005/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ✅ Filtering (unchanged)
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.admin || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.target_user || "").toLowerCase().includes(search.toLowerCase());

    const matchesColumnFilters =
      (log.admin || "").toLowerCase().includes(filters.admin.toLowerCase()) &&
      (log.action || "").toLowerCase().includes(filters.action.toLowerCase()) &&
      (log.target_user || "").toLowerCase().includes(filters.target_user.toLowerCase());

    const logDate = new Date(log.timestamp);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    const matchesDate =
      (!fromDate || logDate >= fromDate) &&
      (!toDate || logDate <= toDate);

    return matchesSearch && matchesColumnFilters && matchesDate;
  });

  // ✅ Sorting (unchanged)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aVal = a[sortConfig.key] || "";
    let bVal = b[sortConfig.key] || "";

    if (sortConfig.key === "timestamp") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // ✅ CSV Export (unchanged)
  const exportToCSV = () => {
    const headers = ["ID", "Admin", "Action", "Target User", "Timestamp"];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.admin || "System",
      log.action,
      log.target_user || "N/A",
      new Date(log.timestamp).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const inputClass =
    "px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] p-6 md:p-10 text-slate-100 relative overflow-hidden">

      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-indigo-600 opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[300px] h-[300px] bg-purple-600 opacity-20 blur-3xl rounded-full"></div>

      <div className="max-w-6xl mx-auto bg-slate-900/60 backdrop-blur-md border border-slate-700/40 rounded-2xl shadow-2xl p-6">

        <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} mb-4 w-full max-w-sm`}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input placeholder="Filter Admin" className={inputClass}
            onChange={(e) => setFilters({ ...filters, admin: e.target.value })} />
          <input placeholder="Filter Action" className={inputClass}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
          <input placeholder="Filter User" className={inputClass}
            onChange={(e) => setFilters({ ...filters, target_user: e.target.value })} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <input type="date" className={inputClass}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
          <input type="date" className={inputClass}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />

          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading logs...</p>
        ) : sortedLogs.length === 0 ? (
          <p className="text-slate-400">No logs found</p>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full">
                <thead className="bg-slate-800/70 text-slate-300 text-xs uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("admin")}>Admin</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("action")}>Action</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("target_user")}>Target User</th>
                    <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort("timestamp")}>Timestamp</th>
                  </tr>
                </thead>

                <tbody>
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">{log.admin || "System"}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3">{log.target_user}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                className="px-4 py-2 bg-slate-800 rounded disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>

              <span>Page {currentPage} of {totalPages}</span>

              <button
                className="px-4 py-2 bg-slate-800 rounded disabled:opacity-40"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;