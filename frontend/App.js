import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TicketForm from "./components/TicketForm";
import ViewTickets from "./components/ViewTickets";
import AdminLogin from "./components/AdminLogin";

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // On initial load, check if the admin is logged in from localStorage
  useEffect(() => {
    const loggedInStatus = localStorage.getItem("isAdminLoggedIn");
    if (loggedInStatus === "true") {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Handle login
  const handleLogin = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem("isAdminLoggedIn", "true");
  };

  // Handle logout
  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem("isAdminLoggedIn");
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        {/* Main content */}
        <div className="flex-grow w-full max-w-5xl bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-yellow-500/20 mx-auto mt-6 pb-16">
          <Routes>
            {/* If not logged in, show the login page */}
            <Route
              path="/"
              element={<TicketForm onTicketSubmit={() => {}} />}
            />
            <Route
              path="/view-tickets"
              element={
                isAdminLoggedIn ? (
                  <ViewTickets onLogout={handleLogout} />
                ) : (
                  <AdminLogin setIsAdminLoggedIn={handleLogin} />
                )
              }
            />
          </Routes>
        </div>

        {/* Centered Footer */}
        <footer className="fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-inner z-50">
          <div className="text-center py-3 text-gray-300 text-sm">
            <span className="font-medium text-yellow-400">
              Developed by Sujan Ghosh
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
