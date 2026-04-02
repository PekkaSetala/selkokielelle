const API_URL = '/api/translate'; // PRODUCTION — change to 'http://localhost:8000/api/translate' for local dev

const inputEl    = document.getElementById('input-text');
const editorEl   = document.getElementById('editor');
const countEl    = document.getElementById('char-count');
const btnConv    = document.getElementById('convert-btn');
const btnClear   = document.getElementById('clear-btn');
const outputWrap = document.getElementById('output-wrap');
const outputEl   = document.getElementById('output-text');
const btnCopy    = document.getElementById('copy-btn');

const MAX = 5000;

function renderParagraphs(text) {
  return text.split(/\n\n+/).map(para => {
    const div = document.createElement('div');
    div.textContent = para.trim();
    return `<p>${div.innerHTML}</p>`;
  }).join('');
}

const limitHint = document.getElementById('limit-hint');

/* Initial fade-in: add .appeared after the animation delay so opacity
   transitions from 0 → 1 via CSS transition, not animation fill-mode.
   This keeps opacity in the normal cascade layer where :has() can override it. */
setTimeout(() => editorEl.classList.add('appeared'), 120);

inputEl.addEventListener('input', () => {
  const len = inputEl.value.length;
  const warn = len > MAX * .85;
  const over = len > MAX;

  const prefix = over ? '\u26A0 ' : warn ? '! ' : '';
  countEl.textContent = `${prefix}${len} / ${MAX}`;
  countEl.className = 'char-count' + (over ? ' over' : warn ? ' warn' : '');
  btnConv.disabled = len === 0 || over;
  btnClear.disabled = len === 0;
  limitHint.classList.toggle('visible', over);
});

btnConv.addEventListener('click', async () => {
  const text = inputEl.value.trim();
  if (!text) return;

  btnConv.classList.add('is-loading');
  btnConv.setAttribute('aria-label', 'Muunnetaan, odota...');
  btnConv.setAttribute('aria-busy', 'true');
  btnConv.disabled = true;
  outputWrap.className = 'output state-loading';
  outputEl.classList.remove('visible');
  outputWrap.querySelector('.output-body').style.height = '';
  btnCopy.disabled = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (response.ok && data.result) {
      if (window.goatcounter) window.goatcounter.count({ path: 'translate', title: 'Muunna clicked' });
      outputEl.innerHTML = renderParagraphs(data.result);
      outputWrap.className = 'output state-done';
      requestAnimationFrame(() => {
        outputEl.classList.add('visible');
        btnCopy.disabled = false;

        // C: Adaptive card height (mobile only — desktop uses height: auto)
        if (!window.matchMedia('(min-width: 800px)').matches) {
          const bodyEl = outputWrap.querySelector('.output-body');
          const VPAD = 37; // 1.1rem top + 1.1rem bottom at 17px root = ~37.4px
          const targetH = Math.max(120, outputEl.offsetHeight + VPAD);
          bodyEl.style.height = targetH + 'px';
        }
      });
    } else {
      let msg;
      if (response.status === 429) {
        msg = 'Liian monta pyyntöä. Voit tehdä 30 muunnosta tunnissa. Odota hetki ja yritä uudelleen.';
      } else {
        msg = (data && data.error) ? data.error : 'Jokin meni pieleen, yritä uudelleen.';
      }
      const div = document.createElement('div');
      div.textContent = msg;
      outputEl.innerHTML = `<p>${div.innerHTML}</p>`;
      outputWrap.className = 'output state-done';
      outputEl.classList.add('visible');
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const div = document.createElement('div');
    if (err.name === 'AbortError') {
      div.textContent = 'Tämä kestää odotettua kauemmin. Yritä uudelleen tai kokeile lyhyempää tekstiä.';
    } else {
      div.textContent = 'Yhteysongelma. Tarkista verkkoyhteys ja yritä uudelleen.';
    }
    outputEl.innerHTML = `<p>${div.innerHTML}</p>`;
    outputWrap.className = 'output state-done';
    outputEl.classList.add('visible');
  } finally {
    btnConv.classList.remove('is-loading');
    btnConv.removeAttribute('aria-label');
    btnConv.removeAttribute('aria-busy');
    btnConv.disabled = inputEl.value.length === 0 || inputEl.value.length > MAX;
  }
});

btnClear.addEventListener('click', () => {
  inputEl.value = '';
  countEl.textContent = `0 / ${MAX}`;
  countEl.className = 'char-count';
  btnConv.disabled = true;
  btnClear.disabled = true;
  btnCopy.disabled = true;
  outputEl.innerHTML = '';
  outputWrap.querySelector('.output-body').style.height = '';
  outputEl.classList.remove('visible');
  outputWrap.className = 'output state-empty';
});

btnCopy.addEventListener('click', () => {
  const text = outputEl.textContent;

  function showCopied() {
    const orig = btnCopy.innerHTML;
    btnCopy.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Kopioitu`;
    document.getElementById('copy-status').textContent = 'Kopioitu';
    setTimeout(() => {
      btnCopy.innerHTML = orig;
      document.getElementById('copy-status').textContent = '';
    }, 2000);
  }

  function showFailed() {
    const orig = btnCopy.innerHTML;
    btnCopy.innerHTML = '\u2715 Kopiointi epäonnistui';
    document.getElementById('copy-status').textContent = 'Kopiointi epäonnistui';
    setTimeout(() => {
      btnCopy.innerHTML = orig;
      document.getElementById('copy-status').textContent = '';
    }, 2000);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopied).catch(() => {
      execCommandFallback(text) ? showCopied() : showFailed();
    });
  } else {
    execCommandFallback(text) ? showCopied() : showFailed();
  }
});

function execCommandFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
  }
}
