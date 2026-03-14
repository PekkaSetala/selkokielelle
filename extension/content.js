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
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;400;500&display=swap');
      :host { all: initial; }
      [hidden] { display: none !important; }
      #skl-panel { display: flex; flex-direction: column; width: 100%; height: 100vh; background: #F9F8F6; color: #1C1B19; font-family: 'DM Sans', sans-serif; font-size: 17px; box-shadow: -2px 0 0 0 #D0CCBF, -8px 0 32px rgba(0, 0, 0, 0.18); border-left: 1px solid #D0CCBF; -webkit-font-smoothing: antialiased; }
      #skl-header { display: flex; align-items: center; justify-content: space-between; padding: 0 1.1rem; height: 56px; flex-shrink: 0; border-bottom: 1px solid #D0CCBF; }
      #skl-wordmark { font-family: 'Instrument Serif', serif; font-size: 1.5rem; font-weight: 400; color: #1C1B19; letter-spacing: -.01em; }
      #skl-close { background: none; border: none; cursor: pointer; color: #6B6860; line-height: 1; padding: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-right: -0.5rem; transition: color 120ms, background 120ms; flex-shrink: 0; }
      #skl-close:hover { color: #1C1B19; background: #EDEAE3; }
      #skl-close:focus-visible { outline: 2px solid #2C4BFF; outline-offset: 2px; }
      #skl-body { flex: 1; overflow-y: auto; padding: 1rem; }
      .skl-state { background: #FFFFFF; border: 1px solid #D0CCBF; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 20px rgba(0,0,0,.04); animation: skl-fadein 0.35s ease both; }
      #skl-state-loading { padding: 1.1rem 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
      #skl-loading-label { font-size: .8rem; color: #908C83; margin-bottom: .6rem; }
      .skl-skeleton-line { height: 1rem; border-radius: 4px; background: linear-gradient(90deg, #D0CCBF 25%, #ECEAE4 50%, #D0CCBF 75%); background-size: 200% 100%; animation: skl-shimmer 1.4s infinite; }
      #skl-slow-msg { margin-top: 1rem; font-size: 0.8rem; color: #908C83; opacity: 0; transition: opacity 400ms; }
      #skl-state-result { display: flex; flex-direction: column; }
      #skl-result-body { padding: 1.1rem 1rem; flex: 1; overflow-y: auto; display: flex; align-items: flex-start; }
      #skl-result-text { font-size: 1rem; font-weight: 300; line-height: 1.75; color: #1C1B19; margin: 0; width: 100%; }
      #skl-result-text p { margin: 0 0 1em 0; }
      #skl-result-text p:last-child { margin-bottom: 0; }
      #skl-result-copy-row { padding: .6rem 1rem; border-top: 1px solid #D0CCBF; display: flex; justify-content: flex-end; background: #F9F8F6; flex-shrink: 0; }
      #skl-error-msg { font-size: 1.1rem; line-height: 1.7; color: #1C1B19; margin: 0 0 1rem; }
      #skl-retry { display: inline-flex; align-items: center; background: none; border: 1.5px solid #1C1B19; border-radius: 99px; padding: 0.5rem 1.25rem; font-size: 0.95rem; font-weight: 500; font-family: inherit; color: #1C1B19; cursor: pointer; transition: background 120ms, color 120ms; margin-top: 0.25rem; }
      #skl-retry:hover { background: #1C1B19; color: #F9F8F6; }
      #skl-retry:focus-visible { outline: 2px solid #2C4BFF; outline-offset: 3px; }
      #skl-copy { display: inline-flex; align-items: center; gap: .45rem; background: transparent; border: 1px solid #D0CCBF; border-radius: 99px; padding: .35rem .9rem; font-size: .82rem; font-weight: 500; font-family: inherit; color: #6B6860; cursor: pointer; transition: background 120ms, color 120ms, border-color 120ms; }
      #skl-copy:hover { background: #EDEAE3; border-color: #908C83; color: #1C1B19; }
      #skl-copy:active { transform: scale(0.97); }
      #skl-copy:focus-visible { outline: 2px solid #2C4BFF; outline-offset: 2px; }
      @keyframes skl-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes skl-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    <div id="skl-header">
      <span id="skl-wordmark">Selkokielelle</span>
      <button id="skl-close" aria-label="Sulje">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      </svg>
    </button>
    </div>
    <div id="skl-body">
      <div id="skl-state-loading" class="skl-state">
        <p id="skl-loading-label">Muunnetaan…</p>
        <div class="skl-skeleton-line" style="width:100%"></div>
        <div class="skl-skeleton-line" style="width:88%"></div>
        <div class="skl-skeleton-line" style="width:95%"></div>
        <div class="skl-skeleton-line" style="width:72%"></div>
        <p id="skl-slow-msg">Tämä kestää hetken...</p>
      </div>
      <div id="skl-state-result" class="skl-state" hidden>
        <div id="skl-result-body">
          <p id="skl-result-text"></p>
        </div>
        <div id="skl-result-copy-row">
          <button id="skl-copy">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Kopioi
          </button>
        </div>
      </div>
      <div id="skl-state-error" class="skl-state" hidden>
        <p id="skl-error-msg"></p>
        <button id="skl-retry">Yritä uudelleen</button>
      </div>
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
    'font-family:\'DM Sans\',system-ui,-apple-system,sans-serif',
    'font-size:0.8rem',
    'border-radius:10px',
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
    'width:400px',
    'height:100vh',
    'z-index:2147483647',
    'background:#F9F8F6',
    'overflow:hidden',
    'transform:translateX(100%)',
    'transition:transform 220ms cubic-bezier(0.22,1,0.36,1)',
  ].join(';');

  shadowRoot = host.attachShadow({ mode: 'closed' });

  panel = buildPanel();
  shadowRoot.appendChild(panel);

  document.documentElement.appendChild(host);

  shadowRoot.getElementById('skl-close').addEventListener('click', hidePanel);
  shadowRoot.getElementById('skl-retry').addEventListener('click', () => {
    if (lastText) triggerTranslation(lastText);
  });
  shadowRoot.getElementById('skl-copy').addEventListener('click', () => {
    const text = shadowRoot.getElementById('skl-result-text').textContent;
    const COPY_HTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Kopioi';
    const CHECK_HTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Kopioitu';
    const btn = shadowRoot.getElementById('skl-copy');
    navigator.clipboard.writeText(text).then(() => {
      btn.innerHTML = CHECK_HTML;
      setTimeout(() => { btn.innerHTML = COPY_HTML; }, 2000);
    }).catch(() => {
      const FAIL_HTML = '✕ Kopiointi epäonnistui';
      btn.innerHTML = FAIL_HTML;
      setTimeout(() => { btn.innerHTML = COPY_HTML; }, 2000);
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
  document.documentElement.style.transition = 'margin-right 220ms cubic-bezier(0.22,1,0.36,1)';
  document.documentElement.style.marginRight = '400px';
  document.documentElement.style.overflowX = 'hidden';
}

function hidePanel() {
  if (host) host.style.transform = 'translateX(100%)';
  document.documentElement.style.marginRight = '';
  document.documentElement.style.overflowX = '';
}

// ── States ───────────────────────────────────────────────────────────────────

function setState(name) {
  const states = ['skl-state-loading', 'skl-state-result', 'skl-state-error'];
  states.forEach((id) => {
    shadowRoot.getElementById(id).hidden = id !== `skl-state-${name}`;
  });
  if (name === 'loading') {
    const slowMsg = shadowRoot.getElementById('skl-slow-msg');
    slowMsg.style.opacity = '0';
    setTimeout(() => {
      if (!slowMsg.closest('[hidden]')) slowMsg.style.opacity = '1';
    }, 4000);
  }
}

// ── Paragraph rendering ─────────────────────────────────────────────────────

function renderParagraphs(text) {
  return text.split(/\n\n+/).map(para => {
    const div = document.createElement('div');
    div.textContent = para.trim();
    return `<p>${div.innerHTML}</p>`;
  }).join('');
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
        resultEl.innerHTML = renderParagraphs(data.result);
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
