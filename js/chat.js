// Carleton-NTN Lab chatbot widget. Talks to /api/chat, which owns the API key,
// enforces the per-session question limit, and answers only from this site.
(function () {
  const MAX = 10;
  const root = document.getElementById('ntnchat');
  if (!root) return;

  const q = (sel) => root.querySelector(sel);
  const launcher = q('.ntnchat__launcher');
  const log = q('.ntnchat__log');
  const form = q('.ntnchat__form');
  const input = q('.ntnchat__input');
  const sendBtn = q('.ntnchat__send');
  const counter = q('.ntnchat__counter');

  const history = [];           // {role, content} — resent each turn for context
  let remaining = MAX;
  let busy = false;
  let greeted = false;

  function open() {
    root.classList.add('is-open');
    document.body.classList.add('ntnchat-open');   // fades the hero scroll cue
    launcher.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      bubble('assistant', "Caw! 🐦‍⬛ I'm RavenBot, the lab's resident raven. Ask me about the Carleton-NTN Lab — our research, people, papers, or patents. I only answer from what's here on the website.");
    }
    setTimeout(() => input.focus(), 50);
  }
  function close() {
    root.classList.remove('is-open');
    document.body.classList.remove('ntnchat-open');
    launcher.setAttribute('aria-expanded', 'false');
  }
  launcher.addEventListener('click', () => (root.classList.contains('is-open') ? close() : open()));
  q('.ntnchat__close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Reveal the bubble only once the hero's "scroll down" cue is out of view,
  // so RavenBot never overlaps it (handles both the closed bubble and open panel).
  const cue = document.querySelector('.scroll-cue');
  if (cue && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      const cueVisible = entries[0].isIntersecting;
      if (cueVisible && !root.classList.contains('is-open')) root.classList.remove('ntnchat-ready');
      else root.classList.add('ntnchat-ready');
    }, { threshold: 0 }).observe(cue);
  } else {
    root.classList.add('ntnchat-ready');   // fallback: always visible
  }

  function bubble(role, text) {
    const el = document.createElement('div');
    el.className = 'ntnchat__msg ntnchat__msg--' + role;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function setRemaining(n) {
    remaining = Math.max(0, n);
    counter.textContent = remaining > 0
      ? remaining + ' question' + (remaining === 1 ? '' : 's') + ' left'
      : 'Session limit reached';
    if (remaining <= 0) {
      input.disabled = true;
      sendBtn.disabled = true;
      input.placeholder = 'Thanks for visiting!';
    }
  }
  setRemaining(MAX);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy || remaining <= 0) return;

    busy = true;
    input.value = '';
    bubble('user', text);
    history.push({ role: 'user', content: text });

    const typing = bubble('assistant', '…');
    typing.classList.add('is-typing');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();

      const reply = data.reply || data.error || 'Something went wrong. Please try again.';
      bubble('assistant', reply);
      history.push({ role: 'assistant', content: reply });

      if (typeof data.remaining === 'number') setRemaining(data.remaining);
      else if (res.status === 429) setRemaining(0);
    } catch (err) {
      typing.remove();
      bubble('assistant', 'Network error — please try again.');
    } finally {
      busy = false;
      if (remaining > 0) input.focus();
    }
  });
})();
