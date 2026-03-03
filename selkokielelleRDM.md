**selkokielelle.fi**

Requirements & Design Map

Version 1.0 \| March 2026 \| For use with Claude Code

*This document is the single source of truth for the v1 build of
selkokielelle.fi. All implementation decisions reference this document.
Deviations require explicit justification.*

**Contents**

**1.** Project Overview

**2.** Tech Stack

**3.** Architecture

**4.** Project File Structure

**5.** Frontend Spec

**6.** Backend Spec

**7.** AI Integration Spec

**8.** Python Dependencies

**9.** Security & Rate Limiting

**10.** Nginx Configuration Requirements

**11.** Systemd Service Spec

**12.** Environment Variables

**13.** Deployment Workflow

**14.** Domain & SSL

**15.** Pre-Launch Checklist

**16.** Future Considerations

**1. Project Overview**

selkokielelle.fi is a single-page web application that accepts Finnish
text input and returns a simplified Finnish (selkokieli) version of it.
The target users are anyone who needs to communicate more accessibly ---
writers, public sector workers, and educators.

There are no user accounts, no stored data, no history. The app does one
thing and does it well.

**Success definition:** A user pastes Finnish text, clicks a button, and
sees the simplified result on the same page within a few seconds.

**Language:** The entire UI is in Finnish. No internationalisation
required.

**Input limit:** 3000 characters. Sufficient for official letters, news
articles, and public notices.

**Domain:** selkokielelle.fi

**Hosting:** Owner-managed VPS running Ubuntu. Fresh install.

**2. Tech Stack**

*All decisions are final for v1.*

  ----------------- ---------------------------------- ------------------------------------------------------------------------------------------------------------------------------
  **Component**     **Choice**                         **Reason**
  Frontend          Vanilla HTML / CSS / JS            No framework needed for a single interaction. Zero dependencies. Fast to load.
  Backend           Python 3.10+ + FastAPI + Uvicorn   Lightweight, beginner-friendly, excellent validation. Good learning value for a first web app. Python 3.10 minimum required.
  AI Provider       OpenRouter                         Existing account. Model can be swapped without changing backend code.
  AI Model          openai/gpt-4o-mini                 Strong Finnish language support. Follows detailed system prompts reliably. Estimated cost: under €2/month at normal traffic.
  Web Server        Nginx                              Serves static frontend, proxies API to FastAPI, enforces rate limiting. Industry standard.
  SSL               Certbot / Let\'s Encrypt           Free. Auto-renews every 90 days. No maintenance after initial setup.
  Hosting           VPS (Ubuntu 22.04)                 Owner already has the server. Full control. No additional cost.
  Version Control   Git + GitHub                       Enables clean deployment workflow via git pull on the server.
  ----------------- ---------------------------------- ------------------------------------------------------------------------------------------------------------------------------

**3. Architecture**

The frontend and backend share the same domain. Nginx is the only
process exposed to the public internet. FastAPI is internal only.

**3.1 Request Flow**

> User browser\
> \|\
> \| HTTPS (port 443)\
> v\
> Nginx ─────────────────────────────────────────\
> \| GET / \| POST /api/translate\
> v v\
> Serves index.html FastAPI on 127.0.0.1:8000\
> \|\
> \| HTTPS to OpenRouter\
> v\
> openai/gpt-4o-mini\
> \|\
> JSON response\
> \|\
> returned to user browser

**3.2 Architectural Rules**

-   FastAPI is bound to 127.0.0.1:8000 only --- never exposed on a
    public port.

-   The OpenRouter API key lives exclusively in a server environment
    variable. It never appears in frontend code or version control.

-   Nginx is the single public entry point for all traffic.

-   The frontend communicates only with /api/translate on the same
    domain --- never directly with OpenRouter.

**4. Project File Structure**

All project files live in a single Git repository. The structure below
is the required layout.

> selkokielelle/\
> ├── frontend/\
> │ └── index.html \# The entire frontend --- one file\
> ├── backend/\
> │ ├── main.py \# FastAPI application\
> │ ├── requirements.txt \# Python dependencies\
> │ ├── venv/ \# Virtual environment --- NEVER committed\
> │ └── .env \# Local dev only --- NEVER committed\
> ├── .gitignore\
> └── README.md

**4.1 Required .gitignore Contents**

The .gitignore must contain at minimum:

> .env\
> \_\_pycache\_\_/\
> \*.pyc\
> \*.pyo\
> .DS\_Store\
> venv/\
> \*.egg-info/\
> .venv/
>
> **WARNING** *The .env file must be in .gitignore before the first
> commit. If an API key is ever pushed to a public repository it must be
> considered compromised and rotated immediately.*

**5. Frontend Spec**

A single HTML file. No framework. No external dependencies. The entire
UI is in Finnish.

**5.1 Visual Design Direction**

Clean, minimal design appropriate for a Finnish public service tool.
Prioritise readability and accessibility. White background, generous
spacing, simple sans-serif font (system font stack is fine). The design
should feel trustworthy and uncluttered --- this is a utility, not a
marketing page. No decorative elements.

**5.2 Page Elements**

-   A textarea for text input --- maximum 3000 characters, enforced
    client-side and server-side

-   A live character counter --- format: \'2847 / 3000\', updates on
    every keystroke

-   A submit button labelled \'Muunna selkokielelle\'

-   An output area where the simplified text appears after the API
    responds

-   A loading state showing \'Muunnetaan\...\' while the request is in
    progress

-   A Finnish error message area for failure cases

**5.3 API URL Handling**

The frontend must define the API URL as a JavaScript constant at the top
of the script block:

> // Use relative path in production (same domain)\
> // Change to full URL for local development\
> const API\_URL = \'/api/translate\';

For local development, this constant must be changed to
http://localhost:8000/api/translate. In production it must be the
relative path /api/translate. Claude Code should implement this as a
single clearly commented line that is easy to find and change.

**5.4 Behaviour**

-   On submit, send POST to API\_URL with JSON body { \"text\": \"\...\"
    }

-   Disable the submit button while a request is in progress to prevent
    double-submissions

-   On success (response contains \'result\'), display the result in the
    output area

-   On error (response contains \'error\', or network failure), display
    the error message. Preserve the input text --- the user must not
    lose their work.

-   Clear previous output when a new request starts

**5.5 Out of Scope for v1**

-   Copy-to-clipboard button

-   Mobile-specific layout optimisation

-   Analytics or tracking scripts

**6. Backend Spec**

One endpoint. FastAPI on 127.0.0.1:8000. All validation runs before any
call to OpenRouter.

**6.1 Endpoint**

**POST /api/translate**

Request body:

> { \"text\": \"Finnish input text here\" }

Success response --- HTTP 200:

> { \"result\": \"Simplified Finnish text here\" }

Error response --- HTTP 4xx / 5xx:

> { \"error\": \"Finnish error message here\" }

**6.2 Validation**

  ------------------------------------- ----------------- ----------------------------------------------
  **Condition**                         **HTTP Status**   **Error Message (Finnish)**
  Input is empty or whitespace only     400               Teksti ei voi olla tyhjä
  Input exceeds 3000 characters         400               Teksti on liian pitkä
  OpenRouter timeout \> 15 seconds      504               Palvelu ei vastaa juuri nyt, yritä uudelleen
  Unexpected response from OpenRouter   502               Jokin meni pieleen, yritä uudelleen
  ------------------------------------- ----------------- ----------------------------------------------

**6.3 OpenRouter API Call Specification**

The backend must call OpenRouter using the following exact
configuration:

**Endpoint:** https://openrouter.ai/api/v1/chat/completions

**Method:** POST

Required headers:

> Authorization: Bearer {OPENROUTER\_API\_KEY}\
> Content-Type: application/json\
> HTTP-Referer: https://selkokielelle.fi\
> X-Title: selkokielelle.fi
>
> **NOTE** *HTTP-Referer and X-Title are required by OpenRouter.
> Omitting them will cause the API call to be rejected. The values
> should match the production domain.*

Request body structure:

> {\
> \"model\": \"openai/gpt-4o-mini\",\
> \"temperature\": 0.3,\
> \"max\_tokens\": 2000,\
> \"messages\": \[\
> { \"role\": \"system\", \"content\": \"\<SYSTEM\_PROMPT\>\" },\
> { \"role\": \"user\", \"content\": \"\<USER\_INPUT\_TEXT\>\" }\
> \]\
> }

**6.4 Request Timeout**

Set a 15-second timeout on all httpx calls to OpenRouter. If exceeded,
cancel and return the 504 error response.

**7. AI Integration Spec**

**7.1 Model Configuration**

**Provider:** OpenRouter **Model:** openai/gpt-4o-mini **Temperature:**
0.3 **Max tokens:** 2000

**7.2 System Prompt**

Stored as a constant in main.py. This is the verbatim system prompt used
in the original prototype. It is based on official Selkokeskus
guidelines. Do not modify without evaluating output quality on multiple
real-world test inputs.

The final two bullet points under \'Tärkeää --- muoto vastauksessa\' are
critical --- they prevent the model from adding preamble text before the
simplified output.

**Rooli**

Muunna seuraava teksti suomen selkokielelle. Noudata Selkokeskuksen
antamia ohjeita:

**Vuorovaikutus lukijan kanssa ja tekstin kokonaisuus**

Selkotekstit suunnataan erityisesti lukijoille, joilla on eri syistä
johtuvia kielellisiä vaikeuksia. He tarvitsevat selkokieltä selvitäkseen
arkielämästä, nauttiakseen kirjallisuudesta ja voidakseen osallistua
yhteiskunnan toimintaan.

Kun kirjoitat selkotekstiä, pidä koko ajan mielessä, kuka on oletettu
lukijasi. Kirjoita lukijan näkökulmasta ja suuntaa sanasi selkeästi
hänelle. Rakenna tekstistäsi johdonmukaisesti etenevä ja hyvin
jäsennelty kokonaisuus, jossa on tarpeeksi tietoa.

**Lukija on tärkein**

-   Kirjoita lukijan näkökulmasta, älä esimerkiksi organisaation. Mitä
    lukijan on tärkeää tietää tekstin aiheesta?

-   Suuntaa sanasi lukijalle esimerkiksi sinä-muodolla, jos se sopii
    tekstiin. (Voit hakea apurahaa tällä lomakkeella.)

-   Pidä tekstisi tarkoitus kirkkaana mielessäsi. Onko tekstin tarkoitus
    esimerkiksi viihdyttää, antaa tietoa tai opettaa jokin asia
    lukijalle?

-   Mieti, miten lisäät lukijan mielenkiintoa ja motivaatiota tarttua
    tekstiin. Kokeile esimerkiksi lukijaa pohtimaan haastavia lauseita,
    tarinallisuutta, haastatteluita tai tietolaatikoita, jos ne sopivat
    tekstiin.

**Lisää tietoa, karsi tietoa**

-   Mieti, mikä on tekstisi pääviesti. Keskity siihen.

-   Karsi pois kaikki turha tieto, jota lukija ei tarvitse asian
    ymmärtämisen kannalta. Älä kuitenkaan poista kaikkia tekstiä
    elävöittäviä yksityiskohtia.

-   Varo, ettei tekstiisi synny sisällöllisiä aukkoja. Tekstiin syntyy
    sisällöllinen aukko, jos kirjoittaja olettaa lukijan päättelevän tai
    tietävän jotakin, mitä ei sanota tekstissä suoraan.

**Pyri kohteliaaseen ja lukijan huomioivaan sävyyn**

-   Tarkkaile, millainen sävy tekstiin syntyy. Sävy ei saisi olla
    esimerkiksi aliarvioiva, holhoava tai turhan velvoittava.

-   Kirjoita lukijan ikään ja tekstilajiin nähden sopivaa kieltä.

-   Älä aliarvioi lukijaa. Älä selitä sanoja, jotka voit olettaa
    lukijalle tutuiksi. (Lempäälään rakennetaan uusi sairaala. Ei:
    Lempäälään rakennetaan uusi sairaala eli paikka, jossa hoidetaan
    potilaita.)

**Jäsentele tekstiä sopivan kokoisiin osiin**

-   Kerro yhdessä kappaleessa vain yksi tärkeä asia ja yhdessä luvussa
    yksi asiakokonaisuus.

-   Otsikoi teksti niin, että otsikko ja sisältö vastaavat toisiaan.

-   Rytmitä tekstiä väliotsikoilla. Käytä väliotsikoita myös lyhyemmissä
    teksteissä.

-   Etene tekstissä johdonmukaisesti, älä hypi asiasta toiseen.

-   Kertaa aiemmin sanottua etenkin pitemmissä julkaisuissa. Esimerkiksi
    pitkässä tekstissä kertaalleen selitetyn käsitteen voi selittää
    uudestaan.

**Tärkeää --- muoto vastauksessa**

-   Vastaa pelkällä selkokielisellä tekstillä. Älä lisää johdantoa,
    selityksiä tai kommentteja ennen tekstiä tai sen jälkeen.

-   Älä kirjoita esimerkiksi \'Tässä on selkokielinen versio:\' tai
    muuta preambulia. Aloita suoraan tekstillä.

**7.3 Stateless Requests**

No conversation history is maintained. Each API call is independent ---
system prompt plus the current user input only. This keeps cost
predictable and behaviour consistent.

**8. Python Dependencies**

These are the only packages needed. All go in requirements.txt.

**8.1 Virtual Environment Setup**

Always use a virtual environment. Never install packages into the system
Python. Run these commands once inside the backend/ folder:

> python3 \--version \# Must be 3.10 or higher\
> python3 -m venv venv \# Create virtual environment\
> source venv/bin/activate \# Activate it (Linux/Mac)\
> pip install -r requirements.txt
>
> **NOTE** *The systemd service on the server must use the full path to
> the venv Python binary, not the system python3. Example ExecStart:
> /var/www/selkokielelle/backend/venv/bin/uvicorn main:app \--host
> 127.0.0.1 \--port 8000*

**8.2 Packages**

  --------------------- ----------------------------------------------------------------------------------------------
  **Package**           **Purpose**
  fastapi               Web framework. Handles routing, request parsing, validation, and response formatting.
  uvicorn\[standard\]   ASGI server that runs FastAPI. The \[standard\] extra includes performance dependencies.
  httpx                 Async HTTP client for calling the OpenRouter API. Preferred over requests for async FastAPI.
  python-dotenv         Loads environment variables from the .env file during local development only.
  --------------------- ----------------------------------------------------------------------------------------------

Install with:

> pip install -r requirements.txt

**9. Security & Rate Limiting**

Three measures applied at the correct layer. No over-engineering for v1.

**9.1 Rate Limiting --- Nginx**

Each IP address is limited to 10 requests per minute. Requests over this
limit are rejected by Nginx with HTTP 429 before reaching Python.
Generous for real users, blocks automated abuse.

**9.2 CORS --- FastAPI**

The API accepts requests only from https://selkokielelle.fi. All other
origins are rejected. This prevents third parties from using the backend
as a free translation API.

**9.3 Request Timeout --- FastAPI**

If OpenRouter does not respond within 15 seconds the request is
cancelled. This prevents the app from hanging during AI provider
outages.

**9.4 API Key --- Environment Variable**

The OpenRouter API key is always read from the OPENROUTER\_API\_KEY
environment variable. In local development it is loaded from .env. On
the server it is set in the systemd service file. Never hardcoded. Never
committed.

**9.5 Deliberately Out of Scope for v1**

-   CAPTCHA or bot verification

-   User authentication

-   Content filtering (GPT-4o-mini has built-in moderation)

-   DDoS mitigation beyond Nginx rate limiting

**10. Nginx Configuration Requirements**

The Nginx config must satisfy all of the following. Certbot modifies it
for SSL after initial setup.

**10.1 Traffic Routing**

-   Serve frontend/index.html for all requests to / and all non-API
    paths

-   Proxy all requests to /api/ upstream to http://127.0.0.1:8000

-   Pass headers to FastAPI: X-Real-IP, X-Forwarded-For, Host

**10.2 Redirects**

-   Redirect all HTTP (port 80) traffic to HTTPS (port 443)

-   Redirect www.selkokielelle.fi to selkokielelle.fi --- non-www is
    canonical

**10.3 Rate Limiting**

-   Define a rate limit zone scoped by IP: 10 requests per minute

-   Apply it to the /api/ location block only --- not to static file
    serving

-   Return HTTP 429 when the limit is exceeded

**10.4 Static Files**

-   Set root to the frontend/ directory of the project

-   Serve index.html as the default file for /

**11. Systemd Service Spec**

FastAPI must run as a background service that starts on boot and
restarts on failure.

**11.1 Service Requirements**

-   Service name: selkokielelle

-   ExecStart: /var/www/selkokielelle/backend/venv/bin/uvicorn main:app
    \--host 127.0.0.1 \--port 8000 (full path to venv binary --- not
    system python3)

-   Working directory: the backend/ folder of the project on the server

-   Restart on failure with a 5-second delay

-   Enabled to start on boot

-   OPENROUTER\_API\_KEY and ALLOWED\_ORIGIN set directly in the service
    Environment= lines

> **NOTE** *Do NOT use \--reload in the production systemd service. The
> \--reload flag is for local development only. It adds overhead and is
> not safe in production.*

**11.2 Useful Commands**

> sudo systemctl start selkokielelle \# Start the service\
> sudo systemctl stop selkokielelle \# Stop the service\
> sudo systemctl restart selkokielelle \# Restart after code changes\
> sudo systemctl status selkokielelle \# Check if it is running\
> sudo journalctl -u selkokielelle -f \# Stream live logs\
> sudo journalctl -u selkokielelle -n 50 \# Last 50 log lines
>
> **NOTE** *journalctl is the primary debugging tool for the backend. If
> the API is not responding, run the status and log commands above
> before investigating anything else.*

**12. Environment Variables**

  ---------------------- -------------- --------------------------------------------------------------------------------------------------------------
  **Variable**           **Required**   **Description**
  OPENROUTER\_API\_KEY   Yes            OpenRouter API key. Never committed to Git. Set in .env for local dev, in systemd service for production.
  ALLOWED\_ORIGIN        Yes            CORS-allowed origin. Set to https://selkokielelle.fi in production. Use http://localhost:3000 for local dev.
  ---------------------- -------------- --------------------------------------------------------------------------------------------------------------

**12.1 Local .env File --- never committed**

> OPENROUTER\_API\_KEY=sk-or-your-key-here\
> ALLOWED\_ORIGIN=http://localhost:3000

**12.2 Production --- set in systemd service file**

> Environment=OPENROUTER\_API\_KEY=sk-or-your-key-here\
> Environment=ALLOWED\_ORIGIN=https://selkokielelle.fi

**13. Deployment Workflow**

**13.1 Local Development**

Step 1 --- verify Python version, create virtual environment, and start
the backend:

> python3 \--version \# Must be 3.10 or higher\
> cd backend/\
> python3 -m venv venv\
> source venv/bin/activate\
> pip install -r requirements.txt\
> uvicorn main:app \--host 127.0.0.1 \--port 8000 \--reload

Step 2 --- serve the frontend with a local file server. Do NOT open
index.html as a file:// URL --- the browser will block all API calls due
to CORS. Run a simple server from the frontend folder:

> cd frontend/\
> python3 -m http.server 3000

Step 3 --- in index.html, set the API URL constant to the full local
address:

> const API\_URL = \'http://localhost:8000/api/translate\';

Step 4 --- confirm backend/.env has
ALLOWED\_ORIGIN=http://localhost:3000 so CORS allows requests from the
local server. Open http://localhost:3000 in your browser.

> **WARNING** *Never open index.html as a file:// URL during
> development. CORS will silently block every API call and the app will
> appear broken with no clear error message.*

Before deploying to production, change API\_URL back to the relative
path \'/api/translate\'.

**13.2 Initial Server Setup (one time only)**

-   Verify Python version on the server: python3 \--version (must be
    3.10+)

-   Open firewall ports 80 and 443 --- without this the site is
    unreachable even with Nginx running:

> sudo ufw allow 80\
> sudo ufw allow 443\
> sudo ufw status \# Confirm both ports are open

-   Clone the repository on the server, e.g. into /var/www/selkokielelle

-   Create virtual environment and install dependencies: cd backend &&
    python3 -m venv venv && source venv/bin/activate && pip install -r
    requirements.txt

-   Create and enable the systemd service with production environment
    variables

-   Configure Nginx with the requirements in Section 10

-   Point DNS A records to the VPS IP and wait for propagation

-   Run Certbot to issue the SSL certificate and update Nginx

**13.3 Deploying a Change**

> \# On your local machine:\
> git add .\
> git commit -m \"Description of change\"\
> git push origin main\
> \
> \# On the server (via SSH):\
> cd /var/www/selkokielelle\
> git pull origin main\
> sudo systemctl restart selkokielelle

**13.4 Frontend-Only Changes**

Nginx serves index.html as a static file. A git pull is sufficient ---
no systemd restart needed.

**13.5 Verifying the Deployment**

> sudo systemctl status selkokielelle\
> sudo nginx -t\
> curl http://localhost:8000/api/translate \\\
> -X POST -H \'Content-Type: application/json\' \\\
> -d \'{\"text\": \"Testi\"}\'

**14. Domain & SSL**

**14.1 DNS Records**

  ---------- ---------- ---------------- ----------------------------------------------
  **Type**   **Name**   **Value**        **Purpose**
  A          @          VPS IP address   Main domain
  A          www        VPS IP address   www subdomain --- Nginx redirects to non-www
  ---------- ---------- ---------------- ----------------------------------------------

**14.2 SSL Certificate**

Run after Nginx is configured and DNS has propagated:

> sudo certbot \--nginx -d selkokielelle.fi -d www.selkokielelle.fi

Certbot modifies the Nginx config automatically and sets up auto-renewal
via cron.

**14.3 Expected Result**

-   https://selkokielelle.fi --- serves the app

-   http://selkokielelle.fi --- redirects to https automatically

-   https://www.selkokielelle.fi --- redirects to non-www automatically

**15. Pre-Launch Checklist**

Verify every item before considering the app live. Do not skip items.

**15.1 Server & Infrastructure**

-   DNS A records point selkokielelle.fi and www to the VPS IP

-   Nginx is running with no config errors (sudo nginx -t)

-   FastAPI systemd service is running and enabled on boot

-   SSL certificate is issued and https:// works in a browser

-   http:// correctly redirects to https://

-   www. correctly redirects to non-www

**15.2 Backend**

-   OPENROUTER\_API\_KEY is set in the systemd service environment

-   ALLOWED\_ORIGIN is set to https://selkokielelle.fi

-   POST /api/translate returns a valid result for a Finnish test input

-   POST /api/translate returns correct Finnish error for empty input

-   POST /api/translate returns correct Finnish error for input over
    3000 characters

-   A request from a different origin is rejected by CORS

-   Sending 11 rapid requests from one IP triggers HTTP 429

-   A slow/forced timeout returns the Finnish 504 error message

**15.3 Frontend**

-   Page loads correctly at https://selkokielelle.fi

-   Character counter works and counts correctly on every keystroke

-   Submit button is disabled while a request is in progress

-   A successful translation displays the result on the page

-   A failed request shows a Finnish error message without clearing the
    input

-   Loading state \'Muunnetaan\...\' is visible during the request

-   Tested on both desktop and mobile browsers

**15.4 AI Output Quality**

-   Test with at least 3 different real-world Finnish input texts

-   Simplified output reads as genuine selkokieli: short sentences,
    common words, clear structure

-   No raw AI preamble in the output (e.g. \'Tässä on selkokielinen
    versio:\')

-   Output does not add explanations or commentary after the simplified
    text

**16. Future Considerations**

Deliberately out of scope for v1. Noted here so they are not forgotten.

-   User feedback on output quality --- thumbs up/down to collect data
    on whether the AI is producing genuine selkokieli.

-   Document upload --- allow users to upload a .txt or .pdf instead of
    pasting text.

-   Usage analytics --- a basic request counter to understand traffic.

-   Third-party API access --- for organisations wanting to integrate
    selkokieli conversion.

-   Rate limit tuning --- adjust based on real usage data.

-   Selkokeskus alignment --- formal review of the system prompt if the
    app gains public visibility.

-   Copy-to-clipboard button on the output area.

-   Dark mode.

*End of document.*
