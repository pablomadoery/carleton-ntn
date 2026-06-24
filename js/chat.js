// Carleton-NTN Lab chatbot widget. Talks to /api/chat, which owns the API key,
// enforces the per-session question limit, and answers only from this site.
(function () {
  const MAX = 10;
  const root = document.getElementById('ntnchat');
  if (!root) return;

  // Self-contained styles for markdown rendered inside assistant bubbles.
  if (!document.getElementById('ntnchat-md-styles')) {
    const style = document.createElement('style');
    style.id = 'ntnchat-md-styles';
    style.textContent =
      '.ntnchat__msg--assistant{white-space:normal}' +
      '.ntnchat__msg--assistant>:first-child{margin-top:0}' +
      '.ntnchat__msg--assistant>:last-child{margin-bottom:0}' +
      '.ntnchat__msg p{margin:0 0 8px}' +
      '.ntnchat__msg h3,.ntnchat__msg h4,.ntnchat__msg h5,.ntnchat__msg h6{font-size:.96rem;line-height:1.25;margin:12px 0 5px;color:var(--black,#231f20)}' +
      '.ntnchat__msg ul,.ntnchat__msg ol{margin:4px 0 9px;padding-left:1.3em}' +
      '.ntnchat__msg li{margin:2px 0}' +
      '.ntnchat__msg strong{font-weight:700}' +
      '.ntnchat__msg a{color:var(--red,#e91c24);text-decoration:underline}' +
      '.ntnchat__msg code{font-family:var(--font-mono,ui-monospace,Menlo,Consolas,monospace);font-size:.85em;background:rgba(35,31,32,.06);padding:1px 5px;border-radius:3px}';
    document.head.appendChild(style);
  }

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
      bubble('assistant', `👋 Caw!

I'm **RavenBot**, the AI assistant for the Carleton-NTN Lab.

I'm here to help you learn about:

- 🛰️ The lab's research — non-terrestrial networks, 6G, HAPS, LEO satellites, AI/ML for wireless, advanced physical-layer tech, and more
- 👥 Lab members — current students, postdocs, and alumni
- 📚 Publications, patents, and theses
- 📋 Lab activities and news
- 🎤 Prof. Yanikomeroglu's talks and awards

How can I help you today? 😊`);
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

  // --- minimal, XSS-safe markdown renderer for assistant messages ---------
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function renderInline(s) {                       // s is already HTML-escaped
    return s
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function renderMarkdown(md) {
    const lines = escapeHtml(md).split(/\r?\n/);
    let html = '', list = null, para = [];
    const closeList = () => { if (list) { html += '</' + list + '>'; list = null; } };
    const flushPara = () => { if (para.length) { html += '<p>' + renderInline(para.join(' ')) + '</p>'; para = []; } };
    for (const raw of lines) {
      const line = raw.trim();
      let m;
      if (!line) { flushPara(); closeList(); }
      else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
        flushPara(); closeList();
        const lvl = Math.min(m[1].length + 2, 6);
        html += '<h' + lvl + '>' + renderInline(m[2]) + '</h' + lvl + '>';
      } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; }
        html += '<li>' + renderInline(m[1]) + '</li>';
      } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
        flushPara();
        if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; }
        html += '<li>' + renderInline(m[1]) + '</li>';
      } else { closeList(); para.push(line); }
    }
    flushPara(); closeList();
    return html;
  }

  function bubble(role, text) {
    const el = document.createElement('div');
    el.className = 'ntnchat__msg ntnchat__msg--' + role;
    if (role === 'assistant') el.innerHTML = renderMarkdown(text);  // render markdown
    else el.textContent = text;                                     // user input: never as HTML
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
