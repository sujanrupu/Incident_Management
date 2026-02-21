import re
from collections import defaultdict
import requests
from requests.auth import HTTPBasicAuth
from config import JIRA_EMAIL, JIRA_API_TOKEN, JIRA_DOMAIN, SERVICE_DESK_ID


# ------------------------------------
# STOP WORDS (Must Be Defined Globally)
# ------------------------------------
STOP_WORDS = {
    # Articles
    "a", "an", "the",

    # Prepositions
    "in", "on", "at", "to", "from", "with", "by", "for", "of", "about",
    "into", "over", "after", "before", "under", "between", "out", "against",

    # Pronouns
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they", "them",

    # Auxiliary verbs
    "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did",

    # Common verbs
    "unable", "cannot", "cant", "could", "should", "would",

    # Generic issue words
    "issue", "problem", "error", "not", "working", "failed",
    "failure", "connection", "connecting", "access"
}


# ------------------------------------
# Fetch All Tickets
# ------------------------------------
def fetch_all_tickets():
    url = f"https://{JIRA_DOMAIN}/rest/servicedeskapi/request?serviceDeskId={SERVICE_DESK_ID}&limit=50"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Accept": "application/json"}

    try:
        print("Calling Jira API...")
        
        response = requests.get(
            url,
            headers=headers,
            auth=auth,
            timeout=10  # 🔥 prevents infinite hanging
        )

        response.raise_for_status()  # 🔥 catches 4xx/5xx errors

        print("Jira API responded successfully.")
        data = response.json()

    except requests.exceptions.Timeout:
        print("❌ Jira API request timed out.")
        return []

    except requests.exceptions.RequestException as e:
        print(f"❌ Jira API error: {str(e)}")
        return []

    except ValueError:
        print("❌ Failed to parse Jira JSON response.")
        return []

    tickets = []

    for issue in data.get("values", []):
        request_fields = issue.get("requestFieldValues", [])

        def get_field(field_name):
            for field in request_fields:
                if field.get("fieldId") == field_name:
                    val = field.get("value", "")
                    if isinstance(val, list):
                        return " ".join(map(str, val))
                    return str(val)
            return ""

        tickets.append({
            "key": issue.get("issueKey", issue.get("key", "")),
            "summary": get_field("summary"),
            "description": get_field("description"),
            "reporter": get_field("reporterName") or "Unknown",
            "tags": get_field("customfield_10000").split(",") if get_field("customfield_10000") else []
        })

    return tickets


# ------------------------------------
# Extract Main Keyword (Smart Grouping)
# ------------------------------------
def extract_main_keyword(summary):
    if not summary:
        return "unknown"

    summary = summary.lower()
    summary = re.sub(r"[^\w\s]", "", summary)

    words = summary.split()

    # Remove stop words
    meaningful_words = [w for w in words if w not in STOP_WORDS]

    if meaningful_words:
        return meaningful_words[0]

    return words[0] if words else "unknown"


# ------------------------------------
# Optimal Grouping
# ------------------------------------
def group_tickets():
    tickets = fetch_all_tickets()
    grouped = defaultdict(list)

    for ticket in tickets:
        key = extract_main_keyword(ticket.get("summary", ""))
        grouped[key].append(ticket)

    formatted_groups = []

    # Sort groups by highest ticket count (optional but better UX)
    sorted_groups = sorted(grouped.items(), key=lambda x: len(x[1]), reverse=True)

    for key, group in sorted_groups:
        formatted_groups.append({
            "main_issue": group[0].get("summary", "No Summary"),
            "group_key": key,
            "total_tickets": len(group),
            "tickets": group
        })

    print("Total Tickets:", len(tickets))
    print("Total Groups Formed:", len(formatted_groups))

    return formatted_groups

