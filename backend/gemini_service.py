import google.generativeai as genai
import os

# Set your Gemini API key
genai.api_key = os.getenv("GEMINI_API_KEY")

def generate_ticket_tags(summary: str):
    """
    Generate 2-5 concise tags from the ticket summary using Gemini 2.5 Flash.
    Each tag should be of single word
    Returns a list of lowercase tags.
    """
    if not summary:
        return ["general"]

    prompt = f"Read the following Jira ticket summary and suggest 2-5 concise problem tags, separated by commas:\n\nSummary: {summary}\nTags:"

    # Create a GenerativeModel instance with the 'gemini-2.5-flash' model
    model = genai.GenerativeModel('gemini-2.5-flash')

    # Start a chat session
    chat_session = model.start_chat()

    # Send the prompt as the initial message to start the conversation
    response = chat_session.send_message(prompt)

    # Extract assistant output
    text_output = response.text.strip()

    # Split by commas, strip spaces, lowercase
    tags = [t.strip().lower() for t in text_output.split(",") if t.strip()]

    return tags or ["general"]


def classify_issue(summary: str):
    """
    Classify summary into exactly one category:
    - Network Issue
    - Security Issue
    - Hardware Issue
    - Access Issue
    """

    if not summary:
        return "Network Issue"

    prompt = f"""
        You are an IT support ticket classifier.

        Classify the ticket into EXACTLY ONE of these categories:

        Network Issue
        Security Issue
        Hardware Issue
        Access Issue

        Return ONLY the category name.
        No explanation.

        Summary: {summary}
        Category:
        """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        if not response.text:
            raise ValueError("Empty Gemini response")

        text_output = response.text.strip().lower()

        print("Gemini classified as:", text_output)  # Debug log

        # -------------------------
        # Strict normalization mapping
        # -------------------------
        if "network" in text_output:
            return "Network Issue"

        if "hardware" in text_output:
            return "Hardware Issue"

        if "access" in text_output:
            return "Access Issue"

        if "security" in text_output:
            return "Security Issue"

        # -------------------------
        # Rule-based fallback
        # -------------------------
        summary_lower = summary.lower()

        # Hardware keywords
        if any(word in summary_lower for word in [
            "laptop", "desktop", "printer", "keyboard", "mouse",
            "monitor", "screen", "display", "speaker",
            "battery", "charger", "power", "ram", "ssd",
            "broken", "damaged", "not working", "overheating"
        ]):
            return "Hardware Issue"

        # Network keywords
        if any(word in summary_lower for word in [
            "vpn", "network", "internet", "wifi", "lan",
            "router", "switch", "dns", "port",
            "connection", "connectivity", "timeout",
            "server down"
        ]):
            return "Network Issue"

        # Access keywords
        if any(word in summary_lower for word in [
            "password", "login", "access", "permission",
            "account", "authentication", "authorization",
            "locked", "reset", "otp", "mfa", "2fa"
        ]):
            return "Access Issue"

        # If nothing matched, treat as Security (lowest probability)
        return "Security Issue"

    except Exception as e:
        print("Classification error:", e)

        # Safe fallback using rule-based only
        summary_lower = summary.lower()

        if "monitor" in summary_lower or "broken" in summary_lower:
            return "Hardware Issue"

        return "Network Issue"
    