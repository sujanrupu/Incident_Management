import re
import requests
from requests.auth import HTTPBasicAuth
from config import (
    JIRA_EMAIL,
    JIRA_API_TOKEN,
    JIRA_DOMAIN,
    SERVICE_DESK_ID,
    REQUEST_TYPE_ID
)
from gemini_service import generate_ticket_tags, classify_issue

def create_service_desk_ticket(data):
    """
    Creates a Jira ticket with reporter info in description,
    AI-generated keywords (2-5 tags) displayed in frontend,
    and automatic assignment based on issue type (hardware/software).
    """
    summary = data.get("summary", "")
    description = data.get("description", "")
    name = data.get("name", "")
    email = data.get("email", "")

    # -------------------------
    # 1️⃣ Generate keywords/tags
    # -------------------------
    tags = generate_ticket_tags(summary)  # Gemini 2.5 Flash

    # -------------------------
    # 2️⃣ Classify issue type
    # -------------------------
    issue_type = classify_issue(summary)

    assignment_map = {
        "Network Issue": "Arindam Sen(Network Engineer)",
        "Security Issue": "Sayan Roy(Security Analyst)",
        "Hardware Issue": "Soham Das(Hardware Engineer)",
        "Access Issue": "Subhajit Paul(IT Administrator)"
    }

    assigned_to = assignment_map.get(issue_type, "Sayan Roy")

    # -------------------------
    # 3️⃣ Format description
    # -------------------------
    formatted_description = (
        f"Reporter Name: {name}\n"
        f"Reporter Email: {email}\n"
        f"Issue Type: {issue_type}\n"
        f"Assigned To: {assigned_to}\n"
        f"AI-Generated Keywords/Tags: {', '.join(tags)}\n"
        f"Issue Description: {description}"
    )

    # -------------------------
    # 4️⃣ Jira API payload
    # -------------------------
    payload = {
        "serviceDeskId": SERVICE_DESK_ID,
        "requestTypeId": REQUEST_TYPE_ID,
        "requestFieldValues": {
            "summary": summary,
            "description": formatted_description
        }
    }

    response = requests.post(
        f"https://{JIRA_DOMAIN}/rest/servicedeskapi/request",
        json=payload,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
    )

    try:
        result = response.json()
        # Send only tags and assigned person for frontend
        result["tags"] = tags
        result["assigned_to"] = assigned_to
        return result
    except:
        return {
            "error": "Could not parse Jira response",
            "tags": tags,
            "assigned_to": assigned_to
        }

# -------------------------
# Other Jira functions
# -------------------------
def delete_jira_ticket(issue_key):
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{issue_key}"
    response = requests.delete(
        url,
        auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json"}
    )
    if response.status_code == 204:
        return {"success": True, "message": "Ticket deleted successfully"}
    return {"success": False, "status_code": response.status_code, "error": response.text}


def extract_tags_from_description(description: str):
    return re.findall(r'#\w+', description)


def get_ticket_details(ticket_id):
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{ticket_id}"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
    response = requests.get(url, auth=auth, headers={"Accept": "application/json"})

    if response.status_code == 200:
        ticket_data = response.json()
        description = ticket_data["fields"]["description"]
        tags = extract_tags_from_description(description)
        return {
            "ticket_key": ticket_data["key"],
            "summary": ticket_data["fields"]["summary"],
            "description": description,
            "tags": tags,
        }
    return {"error": "Ticket not found"}


def transition_ticket(issue_key, transition_name):
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{issue_key}/transitions"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)

    response = requests.get(url, auth=auth, headers={"Accept": "application/json"})
    transitions = response.json().get("transitions", [])

    transition_id = None
    for t in transitions:
        if t["name"].lower() == transition_name.lower():
            transition_id = t["id"]
            break

    if not transition_id:
        return {"success": False, "message": "Transition not found"}

    transition_url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{issue_key}/transitions"
    payload = {"transition": {"id": transition_id}}

    result = requests.post(
        transition_url,
        json=payload,
        auth=auth,
        headers={"Accept": "application/json", "Content-Type": "application/json"}
    )

    if result.status_code == 204:
        return {"success": True}
    return {"success": False, "error": result.text}

def delete_jira_ticket(issue_key):
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{issue_key}"

    response = requests.delete(
        url,
        auth=HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json"}
    )

    if response.status_code == 204:
        return {"success": True, "message": "Ticket deleted successfully"}
    else:
        return {
            "success": False,
            "status_code": response.status_code,
            "error": response.text
        }

def extract_tags_from_description(description: str):
    """
    Extract tags from the description field based on some pattern (e.g., words prefixed by '#').
    This is a basic example to find tags in the description.
    Modify it as needed.
    """
    # For example, tags are words prefixed with '#' like #networking, #connectivity
    return re.findall(r'#\w+', description)

def get_ticket_details(ticket_id):
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{ticket_id}"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
    response = requests.get(url, auth=auth, headers={"Accept": "application/json"})

    if response.status_code == 200:
        ticket_data = response.json()
        description = ticket_data["fields"]["description"]

        # Extract tags from description
        tags = extract_tags_from_description(description)

        # Return ticket data along with tags
        return {
            "ticket_key": ticket_data["key"],
            "summary": ticket_data["fields"]["summary"],
            "description": description,
            "tags": tags,
        }

    return {"error": "Ticket not found"}


def transition_ticket(issue_key, transition_name):
    # Get available transitions for the ticket
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{issue_key}/transitions"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)

    response = requests.get(url, auth=auth, headers={"Accept": "application/json"})
    transitions = response.json().get("transitions", [])

    # Find the transition ID for the provided transition name
    transition_id = None
    for t in transitions:
        if t["name"].lower() == transition_name.lower():
            transition_id = t["id"]
            break

    if not transition_id:
        return {"success": False, "message": "Transition not found"}

    # Perform the transition to the new status
    transition_url = f"https://{JIRA_DOMAIN}/rest/api/3/issue/{issue_key}/transitions"
    payload = {
        "transition": {
            "id": transition_id
        }
    }

    result = requests.post(
        transition_url,
        json=payload,
        auth=auth,
        headers={"Accept": "application/json", "Content-Type": "application/json"}
    )

    if result.status_code == 204:
        return {"success": True}
    else:
        return {"success": False, "error": result.text}
