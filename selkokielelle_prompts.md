# selkokielelle.fi — Claude Code Prompt Set
**Version 1.1 | March 2026**

Use these prompts in order, one at a time. Start a new Claude Code session for each phase if the context grows too long. Always paste the full prompt — do not summarise or shorten it.

---

## Opening Prompt (paste this first, before any phase)

```
I am building a web app called selkokielelle.fi. It is a single-page Finnish-to-selkokieli (simplified Finnish) translation tool.

Before we start writing any code, read the file selkokielelleRDM.md in the project root. This is the Requirements & Design Map for the entire project. All implementation decisions are defined there. Do not deviate from it unless I explicitly ask you to.

Confirm you have read it and give me a one-sentence summary of what this app does.
```

---

## Phase 0 — Prerequisites

**Run this phase before touching any code. Do it on your local machine, not the server.**

```
I am about to start building selkokielelle.fi. Before writing any code, I need to set up three things. Guide me through each one step by step. Do not move to the next step until I confirm the previous one is done.

Step 1 — OpenRouter API key
I have an OpenRouter account at openrouter.ai. Help me find or create an API key there. Tell me exactly where to look in the dashboard. Once I have the key, I will keep it somewhere safe — I will NOT paste it into the chat.

Step 2 — GitHub repository
Help me create a new private GitHub repository called selkokielelle-fi. Walk me through it on github.com (no CLI yet). Once created, give me the exact git commands to run on my local machine to initialise a local folder and connect it to this remote repo.

Step 3 — SSH key on the server
I have a VPS running Ubuntu 22.04. I need to set up an SSH key pair so the server can pull from GitHub without a password (for the deployment step later). Walk me through:
- Generating an SSH key pair on the server
- Adding the public key to GitHub as a deploy key (read-only is fine)
- Testing that the server can reach GitHub over SSH

If any step fails, paste the complete error output back to me before doing anything else.
```

---

## Phase 1 — Project Structure

```
We are building selkokielelle.fi. The RDM is in selkokielelleRDM.md — read Section 4 (Project File Structure) before doing anything.

Create the exact folder and file structure defined in Section 4. Use touch and mkdir commands only — do not write any content into the files yet. The structure must include:

- backend/
  - main.py
  - requirements.txt
  - .env (empty for now)
- frontend/
  - index.html  (CSS and JS are inline — this is the only frontend file)
- .gitignore
- README.md

After creating the structure, run: find . -not -path './.git/*' -type f

If this fails, paste the complete error output back to me before doing anything else.

The output should match Section 4 exactly. If anything is missing or misnamed, fix it before we continue.
```

---

## Phase 2 — Python Dependencies and Virtual Environment

```
We are building selkokielelle.fi. Read Section 8 (Python Dependencies) and Section 6.2 (Environment Variables) in selkokielelleRDM.md before starting.

Do the following in order:

1. Inside the backend/ folder, create a Python virtual environment called venv:
   python3 -m venv venv

2. Activate it:
   source venv/bin/activate

3. Install the required packages listed in Section 8 of the RDM.

4. Freeze the dependencies into requirements.txt:
   pip freeze > requirements.txt

5. Add the following to .gitignore if not already there:
   venv/
   __pycache__/
   .env

6. Verify the venv is working:
   python3 -c "import fastapi; import uvicorn; import httpx; print('All imports OK')"

If this fails, paste the complete error output back to me before doing anything else.

Do not write any application code yet.
```

---

## Phase 3 — Backend (FastAPI)

```
We are building selkokielelle.fi. Read Section 6 (Backend Spec) and Section 7 (AI Integration Spec) in selkokielelleRDM.md carefully before writing any code.

Write the complete backend/main.py file. It must implement exactly what is described in those two sections:

- FastAPI app with a single POST endpoint at /api/translate
- Input: JSON body with a field named "text" (string, max 3000 characters)
- CORS: allow only the origin defined in the ALLOWED_ORIGIN environment variable
- Reads OPENROUTER_API_KEY and ALLOWED_ORIGIN from environment variables (via python-dotenv)
- Calls OpenRouter using the model openai/gpt-4o-mini
- Uses the exact system prompt from Section 7.2 of the RDM — do not shorten or paraphrase it
- Returns: JSON with a field named "result" containing the simplified text
- Returns a clear HTTP error (422 or 400) if the input is empty or over 3000 characters
- Returns a 500 error with a Finnish message if the OpenRouter call fails

After writing the file, create a minimal backend/.env for local testing:
OPENROUTER_API_KEY=your-key-here
ALLOWED_ORIGIN=http://localhost:3000

Then test the backend:
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

If this fails, paste the complete error output back to me before doing anything else.

Leave it running and tell me what you see in the terminal output.
```

---

## Phase 4 — Frontend (HTML / CSS / JS)

```
We are building selkokielelle.fi. Read Section 5 (Frontend Spec) in selkokielelleRDM.md before writing any code. The entire UI is in Finnish.

Write one file:

frontend/index.html — a single self-contained file with all CSS in a <style> block and all JavaScript in a <script> block. Do not create separate style.css or app.js files. Everything lives in index.html.

The file must include:
- A <style> block with clean, minimal CSS: white background, generous spacing, system font stack, mobile-friendly layout
- A Finnish UI: textarea with Finnish placeholder and label, character counter (format: '2847 / 3000'), submit button labelled 'Muunna selkokielelle', hidden result area, loading indicator, error message area
- A <script> block with all JavaScript:
  - API_URL constant at the very top of the script, clearly commented (see below)
  - Character counter updating on every keystroke
  - Validation: not empty, not over 3000 characters (Finnish error messages)
  - Submit button disabled while request is in progress
  - POST to API_URL with JSON body {"text": "..."}
  - On success: show result, hide loading
  - On error: show Finnish error message, preserve input text, hide loading

The API_URL line must look exactly like this, as the very first line of the script block:
const API_URL = '/api/translate'; // PRODUCTION — change to 'http://localhost:8000/api/translate' for local dev

After writing the files, start a local server to test:
cd frontend && python3 -m http.server 3000

If this fails, paste the complete error output back to me before doing anything else.

Then open http://localhost:3000 in a browser. The backend should already be running on port 8000 from Phase 3. For this local test only, temporarily set API_URL = 'http://localhost:8000/api/translate' and add your real OpenRouter API key to backend/.env. Test with a short Finnish sentence and confirm you get a simplified result back.

Reset API_URL to '/api/translate' before committing anything to git.
```

---

## Phase 5 — Server Configuration Files (Review Only)

```
We are building selkokielelle.fi. Read Section 10 (Nginx Configuration Requirements) and Section 11 (Systemd Service Spec) in selkokielelleRDM.md before starting.

Do not touch the server yet. Instead:

1. Show me the exact Nginx config file you would create for this project, based on Section 10. Use the domain selkokielelle.fi. The config must:
   - Redirect HTTP to HTTPS
   - Serve the frontend/index.html as the root
   - Proxy /api/ to FastAPI on 127.0.0.1:8000
   - Enforce rate limiting as specified in Section 9

2. Show me the exact systemd service file you would create, based on Section 11. It must use the venv Python binary path, not the system python3.

Do not write these files to disk yet. Show them to me and wait for my approval before we proceed to Phase 6.
```

---

## Phase 6 — Deployment Script

```
We are building selkokielelle.fi. Read Section 13 (Deployment Workflow) in selkokielelleRDM.md before starting.

Write a bash script called deploy.sh in the project root. It must perform these steps in order when run on the server:

1. Navigate to the project directory
2. Pull the latest code from the main branch: git pull origin main
3. Activate the virtual environment
4. Install/update Python dependencies: pip install -r backend/requirements.txt
5. Restart the systemd service for the backend
6. Check that the service is running and print its status

After writing the script, make it executable:
chmod +x deploy.sh

Then commit all project files to git (excluding .env and venv/):
git add .
git commit -m "Initial project setup"
git push origin main

If any git or push command fails, paste the complete error output back to me before doing anything else.

Do not run deploy.sh yet — that happens during the pre-launch phase.
```

---

## Pre-Deployment Check — API_URL and Environment Variables

**Run this as a separate prompt before deploying for the first time.**

```
We are about to deploy selkokielelle.fi to the production server. Before anything is pushed live, I need to confirm two things.

1. API_URL check
Open frontend/app.js. Find the line that defines API_URL. It must be:
   const API_URL = '/api/translate';

If it says anything with localhost or port 8000, change it to '/api/translate' right now, commit the change, and push it:
   git add frontend/app.js
   git commit -m "fix: set API_URL to production path"
   git push origin main

2. Environment variable check
On the production server, the backend needs these two environment variables set in the systemd service file (not in a .env file — the .env file is for local development only):
   OPENROUTER_API_KEY=your-real-key
   ALLOWED_ORIGIN=https://selkokielelle.fi

Confirm both values are set correctly in the systemd unit file before we continue.

If either check fails, fix it before running deploy.sh.
```

---

## Phase 7 — Pre-Launch Checklist

```
We are doing the final pre-launch setup for selkokielelle.fi. Read Section 15 (Pre-Launch Checklist) in selkokielelleRDM.md. Go through every item in order.

Work through the following steps on the production server:

1. Clone the repository to the server (if not already done):
   git clone git@github.com:YOUR_USERNAME/selkokielelle-fi.git

2. Create the Python virtual environment on the server inside backend/:
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

3. Install Nginx if not present: sudo apt install nginx -y

4. Create the Nginx config file using the content from Phase 5. Enable it:
   sudo ln -s /etc/nginx/sites-available/selkokielelle /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx

   If nginx -t fails, paste the complete error output back to me before doing anything else.

5. Create the systemd service file using the content from Phase 5. Enable and start it:
   sudo systemctl daemon-reload
   sudo systemctl enable selkokielelle
   sudo systemctl start selkokielelle
   sudo systemctl status selkokielelle

   If the service fails to start, paste the complete error output back to me before doing anything else.

6. Open firewall ports:
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   sudo ufw status

7. Run Certbot to get the SSL certificate:
   sudo certbot --nginx -d selkokielelle.fi -d www.selkokielelle.fi

   If Certbot fails, paste the complete error output back to me before doing anything else.

8. Test the live site:
   curl -s https://selkokielelle.fi | grep "<title"

   If this returns nothing or an error, paste the full curl output back to me before doing anything else.

9. Send a test translation via curl:
   curl -X POST https://selkokielelle.fi/api/translate \
     -H "Content-Type: application/json" \
     -d '{"text": "Tämä on testi."}'

   If this fails or returns an error, paste the complete response back to me before doing anything else.

Do not mark the launch as complete until every step above has succeeded.
```

---

## Notes for the Developer

- **One phase at a time.** Do not skip ahead. Each phase depends on the previous one working correctly.
- **When something fails:** Paste the complete error output back to Claude Code. Do not try to fix it yourself first — you may make it harder to diagnose.
- **The .env file** is for local development only. Never commit it to git. Production environment variables live in the systemd unit file.
- **API_URL** in app.js must be `/api/translate` in git. Change it to the localhost URL only during local testing, and always reset it before committing.
- **The RDM** (selkokielelleRDM.md) is the source of truth. If Claude Code produces something that contradicts the RDM, point it to the relevant section and ask it to correct the output.
