import { useState } from "react";
import Loader from "./Loader";
import MessageBox from "./MessageBox";

export default function TicketForm({ onTicketSubmit }) {
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const inputStyle =
    "w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("https://incident-management-1.onrender.com/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType("success");
        setMessage("Ticket created successfully 🎉");
        setFormData({
          summary: "",
          description: "",
          name: "",
          email: "",
        });
        onTicketSubmit(); // Call the parent function after successful ticket creation
      } else {
        setMessageType("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch (error) {
      setMessageType("error");
      setMessage("Server error. Is backend running?");
    }

    setLoading(false);
  };

  const openViewTickets = () => {
    // Opens the View Tickets page in a new tab
    window.open("/view-tickets", "_blank");
  };

  return (
    <div className="justify-center px-4">
      <div className="w-full max-w-1xl bg-gray-900 p-4 rounded-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6">
          Support Ticket Portal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Issue Summary"
            className={inputStyle}
            required
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your issue..."
            rows="2"
            className={inputStyle}
            required
          />

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your Name"
            className={inputStyle}
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your Email"
            className={inputStyle}
            required
          />

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition shadow-lg hover:shadow-yellow-500/40"
          >
            Submit Ticket
          </button>

          {loading && <Loader />}
          <MessageBox type={messageType} message={message} />
        </form>

        {/* Always visible View Tickets button */}
        <div className="mt-4">
          <button
            onClick={openViewTickets} // Open View Tickets in a new tab
            className="w-full bg-green-600 px-4 py-2 rounded mt-4"
          >
            View All Tickets
          </button>
        </div>
      </div>
    </div>
  );
}


