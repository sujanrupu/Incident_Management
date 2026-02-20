import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ setIsAdminLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "rupubally@gmail.com" && password === "12345") {
      setIsAdminLoggedIn(true); // Set admin login status
      localStorage.setItem("isAdminLoggedIn", "true"); // Store the login status in localStorage
      navigate("/view-tickets"); // Redirect to the ViewTickets page
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">
          Admin Login
        </h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-yellow-400 text-black py-3 rounded-lg"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}