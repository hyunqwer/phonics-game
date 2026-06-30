function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
}

function wordFileName(word) {
  return encodeURIComponent(String(word || '').trim().toLowerCase());
}

export function wordVisual(item, cls = 'be') {
  const word = wordFileName(item && item.w);
  const emo = escapeHtml((item && (item.emo || item.emoji)) || '🔤');
  const className = escapeHtml(cls);
  if (!word) return `<span class="${className}">${emo}</span>`;
  const fallback = `&lt;span class=&quot;${className}&quot;&gt;${emo}&lt;/span&gt;`;
  return `<img class="${className} wimg" src="content/img/words/${word}.webp" alt="" loading="lazy" decoding="async" onerror="this.outerHTML='${fallback}'">`;
}
