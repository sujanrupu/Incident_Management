import os
from dotenv import load_dotenv

load_dotenv()

JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_DOMAIN = os.getenv("JIRA_DOMAIN")
SERVICE_DESK_ID = os.getenv("SERVICE_DESK_ID")          # numeric ID of your Service Desk
REQUEST_TYPE_ID = os.getenv("REQUEST_TYPE_ID")          # numeric ID for incident/request
PROJECT_KEY = os.getenv("PROJECT_KEY")