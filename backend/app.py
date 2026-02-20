import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from jira_service import create_service_desk_ticket, delete_jira_ticket, transition_ticket
from jira_grouping_service import group_tickets

app = Flask(__name__)

# Enable CORS for all Vercel domains (allow any subdomain of vercel.app)
CORS(app, resources={r"/*": {"origins": "https://incident-management-3uau.vercel.app"}})

# -----------------------------
# Create a new ticket
# -----------------------------
@app.route("/create-ticket", methods=["POST"])
def create_ticket():
    data = request.json

    required_fields = ["summary", "description", "name", "email"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    result = create_service_desk_ticket(data)
    return jsonify(result), 200

# -----------------------------
# View all tickets
# -----------------------------
@app.route("/view-all-tickets", methods=["GET"])
def view_all_tickets():
    tickets = group_tickets()
    return jsonify(tickets), 200

# -----------------------------
# Delete Ticket
# -----------------------------
@app.route("/delete-ticket/<issue_key>", methods=["DELETE"])
def delete_ticket(issue_key):
    result = delete_jira_ticket(issue_key)

    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), result.get("status_code", 400)

# -----------------------------
# Update Ticket Status
# -----------------------------
@app.route("/update-status/<issue_key>", methods=["PUT"])
def update_status(issue_key):
    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status required"}), 400

    result = transition_ticket(issue_key, new_status)

    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 400

if __name__ == "__main__":
    # Run the app in production mode with Gunicorn (this will be used for deployment)
    app.run(debug=False, host='0.0.0.0', port=5000)
