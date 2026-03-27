import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
  const logsPerPage = 10;

  // Fetch logs
  const fetchLogs = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchLogs();

    // WebSocket live updates
    const socket = io("http://127.0.0.1:5005");
    socket.on("audit_logs_update", (updatedLogs) => setLogs(updatedLogs));
    return () => socket.disconnect();
  }, [fetchLogs]);

  // CSV Export
  const exportToCSV = (data, filename = "audit_logs.csv") => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${row[h]}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.admin?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target_user.toLowerCase().includes(search.toLowerCase())
  );

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";
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

  if (loading) return <p className="text-slate-100 p-4">Loading logs...</p>;

  return (
    <div className="p-4 min-h-screen bg-gradient-to-b from-[#020617] to-[#0a0f24] text-slate-100">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-2 py-1 w-full max-w-sm bg-slate-900/50 backdrop-blur-md text-slate-100 placeholder:text-slate-400"
        />
        <button
          className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500"
          onClick={() => exportToCSV(sortedLogs)}
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-slate-900/50 backdrop-blur-md shadow-lg border border-slate-800/30">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              {["admin", "action", "target_user", "timestamp"].map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 border-b border-slate-700 cursor-pointer text-left"
                  onClick={() => requestSort(col)}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {sortConfig.key === col ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/70">
                <td className="px-4 py-2 border-b border-slate-700">{log.admin || "System"}</td>
                <td
                  className={`px-4 py-2 border-b border-slate-700 ${
                    log.action.toLowerCase().includes("reset")
                      ? "text-red-500 font-semibold"
                      : log.action.toLowerCase().includes("created")
                      ? "text-green-500 font-semibold"
                      : "text-slate-100"
                  }`}
                >
                  {log.action}
                </td>
                <td className="px-4 py-2 border-b border-slate-700">{log.target_user}</td>
                <td className="px-4 py-2 border-b border-slate-700">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2 items-center">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AuditLogs;