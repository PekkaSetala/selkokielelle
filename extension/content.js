const API_URL = 'https://selkokielelle.online/api/translate';

let host = null;
let shadowRoot = null;
let panel = null;
let lastText = null;

// ── Panel HTML template ─────────────────────────────────────────────────────

function buildPanel() {
  const el = document.createElement('div');
  el.id = 'skl-panel';
  el.innerHTML = `
    <div id="skl-header">
      <span id="skl-wordmark">Selkokielelle</span>
      <button id="skl-close" aria-label="Sulje">&#10005;</button>
    </div>
    <div id="skl-body">
      <div id="skl-state-loading" class="skl-state">
        <div class="skl-skeleton-line" style="width:100%"></div>
        <div class="skl-skeleton-line" style="width:78%"></div>
        <div class="skl-skeleton-line" style="width:60%"></div>
        <p id="skl-slow-msg">Tämä kestää hetken...</p>
      </div>
      <div id="skl-state-result" class="skl-state" hidden>
        <span id="skl-label">SELKOKIELI</span>
        <p id="skl-result-text"></p>
      </div>
      <div id="skl-state-error" class="skl-state" hidden>
        <p id="skl-error-msg"></p>
        <button id="skl-retry">Yritä uudelleen</button>
      </div>
    </div>
    <div id="skl-footer" hidden>
      <button id="skl-copy">Kopioi</button>
    </div>
  `;
  return el;
}

// ── Toast (no-selection notice) ─────────────────────────────────────────────

function showToast(msg) {
  const existing = document.getElementById('skl-toast-host');
  if (existing) existing.remove();

  const toastHost = document.createElement('div');
  toastHost.id = 'skl-toast-host';
  toastHost.style.cssText = [
    'position:fixed',
    'top:1.5rem',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:2147483647',
    'pointer-events:none',
  ].join(';');

  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = [
    'background:#1C1B19',
    'color:#fff',
    'font-family:system-ui,-apple-system,sans-serif',
    'font-size:0.8rem',
    'border-radius:99px',
    'padding:0.45rem 1rem',
    'opacity:0',
    'transition:opacity 150ms',
    'white-space:nowrap',
  ].join(';');

  toastHost.appendChild(toast);
  document.body.appendChild(toastHost);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toastHost.remove(), 200);
    }, 2500);
  });
}

// ── Shadow DOM setup ─────────────────────────────────────────────────────────

function ensurePanel() {
  if (host) return;

  host = document.createElement('div');
  host.id = 'selkokielelle-host';
  host.style.cssText = [
    'position:fixed',
    'top:0',
    'right:0',
    'width:360px',
    'height:100vh',
    'z-index:2147483647',
    'transform:translateX(100%)',
    'transition:transform 220ms cubic-bezier(0.22,1,0.36,1)',
  ].join(';');

  shadowRoot = host.attachShadow({ mode: 'closed' });

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content.css');
  shadowRoot.appendChild(link);

  panel = buildPanel();
  shadowRoot.appendChild(panel);

  document.body.appendChild(host);

  shadowRoot.getElementById('skl-close').addEventListener('click', hidePanel);
  shadowRoot.getElementById('skl-retry').addEventListener('click', () => {
    if (lastText) triggerTranslation(lastText);
  });
  shadowRoot.getElementById('skl-copy').addEventListener('click', () => {
    const text = shadowRoot.getElementById('skl-result-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = shadowRoot.getElementById('skl-copy');
      btn.textContent = 'Kopioitu ✓';
      setTimeout(() => { btn.textContent = 'Kopioi'; }, 2000);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePanel();
  });

  document.addEventListener('mousedown', (e) => {
    if (host && !host.contains(e.target) && host.style.transform !== 'translateX(100%)') {
      hidePanel();
    }
  });
}

// ── Panel visibility ─────────────────────────────────────────────────────────

function showPanel() {
  ensurePanel();
  host.style.transform = 'translateX(0)';
}

function hidePanel() {
  if (host) host.style.transform = 'translateX(100%)';
}

// ── States ───────────────────────────────────────────────────────────────────

function setState(name) {
  const states = ['skl-state-loading', 'skl-state-result', 'skl-state-error'];
  states.forEach((id) => {
    shadowRoot.getElementById(id).hidden = id !== `skl-state-${name}`;
  });
  shadowRoot.getElementById('skl-footer').hidden = name !== 'result';
  if (name === 'loading') {
    const slowMsg = shadowRoot.getElementById('skl-slow-msg');
    slowMsg.style.opacity = '0';
    setTimeout(() => {
      if (!slowMsg.closest('[hidden]')) slowMsg.style.opacity = '1';
    }, 4000);
  }
}

// ── Translation ──────────────────────────────────────────────────────────────

function triggerTranslation(text) {
  lastText = text;
  showPanel();
  setState('loading');

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result) {
        const resultEl = shadowRoot.getElementById('skl-result-text');
        resultEl.textContent = data.result;
        setState('result');
      } else {
        showError(data.error || 'Jokin meni pieleen. Yritä uudelleen.');
      }
    })
    .catch(() => {
      showError('Yhteysongelma. Tarkista verkkoyhteys ja yritä uudelleen.');
    });
}

function showError(msg) {
  shadowRoot.getElementById('skl-error-msg').textContent = msg;
  setState('error');
}

// ── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TRANSLATE') {
    if (!msg.text || !msg.text.trim()) {
      showToast('Valitse ensin teksti.');
      return;
    }
    triggerTranslation(msg.text.trim());
  }

  if (msg.type === 'TRANSLATE_SELECTION') {
    const sel = window.getSelection().toString().trim();
    if (!sel) {
      showToast('Valitse ensin teksti.');
      return;
    }
    if (sel.length > 5000) {
      showToast('Valittu teksti on liian pitkä (yli 5 000 merkkiä).');
      return;
    }
    triggerTranslation(sel);
  }
});
