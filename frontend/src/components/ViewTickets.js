import React, { useEffect, useState, useCallback } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Importing useNavigate for redirect

export default function ViewTickets() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const navigate = useNavigate(); // For redirecting user to login page after logout

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("https://incident-management-1.onrender.com/view-all-tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");

      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);

      const backendStatuses = {};
      data.forEach((group) => {
        group.tickets.forEach((ticket) => {
          if (!statusMap[ticket.key]) {
            backendStatuses[ticket.key] = ticket.status || "Waiting for Support";
          }
        });
      });

      setStatusMap((prev) => ({ ...backendStatuses, ...prev }));
    } catch (err) {
      setError("Could not load tickets.");
    } finally {
      setLoading(false);
    }
  }, [statusMap]); // Dependency on statusMap

  useEffect(() => {
    // Check if the user is logged in
    if (!localStorage.getItem("isAdminLoggedIn")) {
      navigate("/"); // Redirect to login if not logged in
    } else {
      const cached = localStorage.getItem("ticketStatusMap");
      if (cached) setStatusMap(JSON.parse(cached));
      fetchTickets(); // Call memoized fetchTickets function
    }
  }, [navigate, fetchTickets]); // Add fetchTickets as dependency

  const toggleGroup = (index) => {
    setExpandedGroup(expandedGroup === index ? null : index);
  };

  const deleteTicket = async (ticketKey) => {
    if (!window.confirm(`Delete ticket ${ticketKey}?`)) return;

    try {
      const res = await fetch(`https://incident-management-1.onrender.com/delete-ticket/${ticketKey}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            tickets: group.tickets.filter((t) => t.key !== ticketKey),
          }))
          .filter((group) => group.tickets.length > 0)
      );
    } catch {
      alert("Delete failed");
    }
  };

  const handleStatusChange = async (ticketKey, newStatus) => {
    try {
      const res = await fetch(`https://incident-management-1.onrender.com/update-status/${ticketKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed");

      setStatusMap((prev) => {
        const updated = { ...prev, [ticketKey]: newStatus };
        localStorage.setItem("ticketStatusMap", JSON.stringify(updated));
        return updated;
      });
    } catch {
      alert("Status update failed");
    }
  };

  // ----------------- Extractors -----------------
  const extractTags = (description) => {
    const match = description.match(/AI-Generated Keywords\/Tags:\s*([^\n]*)/);
    if (!match) return [];
    return match[1]
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
  };

  const extractAssignedTo = (description) => {
    const match = description.match(/Assigned To:\s*(.*)/);
    return match ? match[1].trim() : "Unassigned";
  };

  const extractIssueType = (description) => {
    const match = description.match(/Issue Type:\s*(.*)/);
    return match ? match[1].trim() : "Application Issue";
  };

  const getIssueTypeColor = (type) => {
    switch (type) {
      case "Network Issue":
        return "bg-blue-500/20 text-blue-400 border-blue-400";
      case "Hardware Issue":
        return "bg-red-500/20 text-red-400 border-red-400";
      case "Access Issue":
        return "bg-purple-500/20 text-purple-400 border-purple-400";
      default:
        return "bg-green-500/20 text-green-400 border-green-400"; // Security / Application Issue
    }
  };

  // ----------------- Logout Functionality -----------------
  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn"); // Remove login state
    navigate("/"); // Redirect to login page
  };

  if (loading) return <div className="text-yellow-400 p-10">Loading...</div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;

  // ----------------- Filtered tickets check -----------------
  const filteredTicketsExist = groups.some((group) =>
    group.tickets.some((ticket) => {
      if (!searchKeyword) return true;
      const tags = extractTags(ticket.description);
      const summaryMatch = ticket.summary.toLowerCase().includes(searchKeyword);
      const idMatch = ticket.key.toLowerCase().includes(searchKeyword);
      return tags.some((tag) => tag.includes(searchKeyword)) || summaryMatch || idMatch;
    })
  );

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white relative">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">
        🚀 AI-Powered Grouped Tickets
      </h1>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>

      <input
        type="text"
        placeholder="Search by tag, summary or ticket ID..."
        className="w-full p-3 mb-8 rounded-xl bg-gray-800 border border-gray-700"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value.toLowerCase())}
      />

      <div className="space-y-8">
        {groups.map((group, index) => {
          // Filter tickets in this group based on search
          const filteredTickets = group.tickets.filter((ticket) => {
            if (!searchKeyword) return true;
            const tags = extractTags(ticket.description);
            const summaryMatch = ticket.summary.toLowerCase().includes(searchKeyword);
            const idMatch = ticket.key.toLowerCase().includes(searchKeyword);
            return tags.some((tag) => tag.includes(searchKeyword)) || summaryMatch || idMatch;
          });
          if (filteredTickets.length === 0) return null;

          return (
            <div key={index} className="bg-gray-800 rounded-2xl border border-gray-700">
              <div
                onClick={() => toggleGroup(index)}
                className="cursor-pointer p-6 "
              >
                <h2 className="text-xl font-semibold text-yellow-300">{group.main_issue}</h2>
                <p className="text-gray-400 text-sm">{filteredTickets.length} Similar Tickets</p>
              </div>

              {expandedGroup === index && (
                <div className="p-6 space-y-6 border-t border-gray-700">
                  {filteredTickets.map((ticket) => {
                    const tags = extractTags(ticket.description);
                    const assignedTo = extractAssignedTo(ticket.description);
                    const issueType = extractIssueType(ticket.description);
                    const currentStatus = statusMap[ticket.key];

                    // Clean description for rendering
                    const cleanDescription = ticket.description
                      .replace(/AI-Generated Keywords\/Tags:.*(\n|$)/, "")
                      .replace(/Assigned To:.*(\n|$)/, "")
                      .replace(/Issue Type:.*(\n|$)/, "");

                    return (
                      <div
                        key={ticket.key}
                        className="bg-gray-900 p-6 rounded-xl border border-gray-700 relative"
                      >
                        {/* Top Row */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex gap-3 flex-wrap">
                            {/* Issue Type Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-sm border ${getIssueTypeColor(
                                issueType
                              )}`}
                            >
                              {issueType}
                            </span>

                            {/* Assigned Badge */}
                            <span className="px-3 py-1 rounded-full text-sm bg-cyan-500/20 text-cyan-400 border border-cyan-400">
                              👤 {assignedTo}
                            </span>
                          </div>

                          <button
                            onClick={() => deleteTicket(ticket.key)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        {/* Tags above ID */}
                        <div className="flex gap-2 flex-wrap mb-4">
                          {tags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Ticket Info */}
                        <p className="text-gray-300 mb-2">
                          <strong>ID:</strong> {ticket.key}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <strong>Summary:</strong> {ticket.summary}
                        </p>
                        <p className="text-gray-400 whitespace-pre-line">{cleanDescription}</p>

                        {/* Status Dropdown */}
                        <div className="mt-4">
                          {["Complete", "Resolved", "Closed"].includes(currentStatus) ? (
                            <span className="text-green-400 font-semibold">✅ Completed</span>
                          ) : (
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                handleStatusChange(ticket.key, e.target.value)
                              }
                              className="bg-yellow-400 text-black px-3 py-1 rounded-full"
                            >
                              <option value="Waiting for Support">Waiting for Support</option>
                              <option value="Complete">Complete</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {!filteredTicketsExist && searchKeyword && (
          <div className="text-center text-gray-400 mt-10">
            No tickets found matching "{searchKeyword}"
          </div>
        )}
      </div>
    </div>
  );
}

