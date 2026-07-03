const state = {
  sources: [],
  mapping: { items: [] },
  selectedSource: null,
  selectedIndex: -1,
  selectedEraseIndex: -1,
  mode: 'crop',
  image: null,
  imageUrl: '',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  drag: null,
};

const els = {
  sourceList: document.querySelector('#sourceList'),
  sourceCount: document.querySelector('#sourceCount'),
  wordList: document.querySelector('#wordList'),
  sourceTitle: document.querySelector('#sourceTitle'),
  sourceMeta: document.querySelector('#sourceMeta'),
  stage: document.querySelector('#stage'),
  cropModeBtn: document.querySelector('#cropModeBtn'),
  eraseModeBtn: document.querySelector('#eraseModeBtn'),
  addWordBtn: document.querySelector('#addWordBtn'),
  deleteWordBtn: document.querySelector('#deleteWordBtn'),
  saveBtn: document.querySelector('#saveBtn'),
  seedSourceBtn: document.querySelector('#seedSourceBtn'),
  autoRefineBtn: document.querySelector('#autoRefineBtn'),
  numberEraseAllBtn: document.querySelector('#numberEraseAllBtn'),
  resetSourceBtn: document.querySelector('#resetSourceBtn'),
  renderWordBtn: document.querySelector('#renderWordBtn'),
  autoRefineWordBtn: document.querySelector('#autoRefineWordBtn'),
  resetWordBtn: document.querySelector('#resetWordBtn'),
  addDefaultEraseBtn: document.querySelector('#addDefaultEraseBtn'),
  renderSourceBtn: document.querySelector('#renderSourceBtn'),
  renderAllBtn: document.querySelector('#renderAllBtn'),
  contactBtn: document.querySelector('#contactBtn'),
  undoEraseBtn: document.querySelector('#undoEraseBtn'),
  wordInput: document.querySelector('#wordInput'),
  statusInput: document.querySelector('#statusInput'),
  eraseModeInput: document.querySelector('#eraseModeInput'),
  boxInput: document.querySelector('#boxInput'),
  notesInput: document.querySelector('#notesInput'),
  previewImg: document.querySelector('#previewImg'),
  contactImg: document.querySelector('#contactImg'),
  statusText: document.querySelector('#statusText'),
  editor: document.querySelector('#editor'),
  inspector: document.querySelector('.inspector'),
  inspectorSplit: document.querySelector('#inspectorSplit'),
  previewBody: document.querySelector('.previewBody'),
  previewSplit: document.querySelector('#previewSplit'),
};

const ctx = els.stage.getContext('2d');
let nextLocalId = 1;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data.error || data || response.statusText);
  return data;
}

function setStatus(message, tone = '') {
  els.statusText.textContent = message;
  els.statusText.className = `statusText ${tone}`;
}

function hydrateMapping(mapping) {
  const items = Array.isArray(mapping?.items) ? mapping.items : [];
  for (const item of items) {
    if (!item._localId) {
      item._localId = `item-${nextLocalId}`;
      nextLocalId += 1;
    }
  }
  return { items };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function runAction(label, action) {
  try {
    setStatus(`${label}...`);
    const result = await action();
    setStatus(`${label} done`, 'ok');
    return result;
  } catch (error) {
    setStatus(error.message || `${label} failed`, 'error');
    console.error(error);
    return null;
  }
}

function itemsForSource() {
  if (!state.selectedSource) return [];
  return state.mapping.items.filter((item) => item.source === state.selectedSource.path);
}

function selectedItem() {
  if (state.selectedIndex < 0) return null;
  return itemsForSource()[state.selectedIndex] || null;
}

function duplicateForActiveItem(item) {
  if (!item || item.status === 'fallback') return null;
  const word = cleanWord(item.word || '');
  if (!word) return null;
  return state.mapping.items.find(
    (candidate) => candidate !== item && candidate.status !== 'fallback' && cleanWord(candidate.word || '') === word,
  ) || null;
}

function findBlockingDuplicate(scope = 'selectedSource') {
  updateSelectedFromForm();
  const items = scope === 'all'
    ? state.mapping.items
    : state.mapping.items.filter((item) => !state.selectedSource || item.source === state.selectedSource.path);
  for (const item of items) {
    const duplicate = duplicateForActiveItem(item);
    if (duplicate) return { item, duplicate };
  }
  return null;
}

function ensureNoBlockingDuplicate(actionLabel = 'action', scope = 'selectedSource') {
  const conflict = findBlockingDuplicate(scope);
  if (!conflict) return true;
  throw new Error(`"${conflict.item.word}" already exists in another source. Delete this box, set it to fallback, or choose another word before ${actionLabel}.`);
}

function previewUrl(item) {
  return `/api/preview?source=${encodeURIComponent(item.source)}&word=${encodeURIComponent(item.word)}&t=${Date.now()}`;
}

function statusCounts(sourcePath) {
  const counts = { draft: 0, approved: 0, needs_edit: 0, fallback: 0 };
  for (const item of state.mapping.items) {
    if (item.source === sourcePath) counts[item.status || 'draft'] += 1;
  }
  return counts;
}

function renderSources() {
  els.sourceCount.textContent = `${state.sources.length}`;
  els.sourceList.innerHTML = '';
  for (const source of state.sources) {
    const counts = statusCounts(source.path);
    const row = document.createElement('button');
    row.className = `row ${state.selectedSource?.path === source.path ? 'active' : ''}`;
    row.innerHTML = `
      <span>
        <span class="name">${source.name}</span>
        <span class="meta">${source.width} x ${source.height}</span>
      </span>
      <span class="badge approved">${counts.approved}</span>
    `;
    row.addEventListener('click', () => selectSource(source));
    els.sourceList.appendChild(row);
  }
}

function renderWords() {
  els.wordList.innerHTML = '';
  const items = itemsForSource();
  items.forEach((item, index) => {
    const row = document.createElement('button');
    row.className = `row ${index === state.selectedIndex ? 'active' : ''}`;
    row.innerHTML = `
      <span>
        <span class="name">${item.word}</span>
        <span class="meta">${item.box.join(', ')}</span>
      </span>
      <span class="badge ${item.status || 'draft'}">${item.status || 'draft'}</span>
    `;
    row.addEventListener('click', () => selectWord(index));
    els.wordList.appendChild(row);
  });
  updateEditor();
}

function updateEditor() {
  const item = selectedItem();
  const disabled = !item;
  els.deleteWordBtn.disabled = disabled;
  els.deleteWordBtn.textContent = item?._isNew ? 'Cancel' : 'Delete';
  for (const input of [els.wordInput, els.statusInput, els.eraseModeInput, els.boxInput, els.notesInput]) {
    input.disabled = disabled;
  }
  if (!item) {
    els.wordInput.value = '';
    els.statusInput.value = 'draft';
    els.eraseModeInput.value = 'transparent';
    els.boxInput.value = '';
    els.notesInput.value = '';
    els.previewImg.removeAttribute('src');
    return;
  }
  els.wordInput.value = item.word;
  els.statusInput.value = item.status || 'draft';
  els.eraseModeInput.value = item.eraseMode || 'transparent';
  els.boxInput.value = item.box.join(', ');
  els.notesInput.value = item.notes || '';
  if (duplicateForActiveItem(item)) {
    els.previewImg.removeAttribute('src');
    setStatus(`"${item.word}" already exists in another source. Preview/render is blocked for this duplicate.`, 'error');
    return;
  }
  els.previewImg.src = previewUrl(item);
}

async function selectSource(source) {
  state.selectedSource = source;
  state.selectedIndex = 0;
  els.sourceTitle.textContent = source.name;
  els.sourceMeta.textContent = `${source.width} x ${source.height}`;
  await loadSourceImage(source);
  renderSources();
  renderWords();
  draw();
}

function selectWord(index) {
  state.selectedIndex = index;
  state.selectedEraseIndex = -1;
  renderWords();
  draw();
}

function keepSelectedWord(word) {
  const nextIndex = itemsForSource().findIndex((item) => item.word === word);
  state.selectedIndex = nextIndex >= 0 ? nextIndex : 0;
  state.selectedEraseIndex = -1;
}

function loadSourceImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.imageUrl = img.src;
      resolve();
    };
    img.onerror = reject;
    img.src = `/api/source-image?source=${encodeURIComponent(source.path)}&t=${Date.now()}`;
  });
}

function resizeCanvas() {
  const wrap = els.stage.parentElement;
  const maxW = Math.max(320, wrap.clientWidth - 24);
  const maxH = Math.max(420, wrap.clientHeight - 24);
  if (!state.image) {
    els.stage.width = Math.floor(maxW);
    els.stage.height = Math.floor(maxH);
    return;
  }
  const scale = Math.min(maxW / state.image.width, maxH / state.image.height);
  els.stage.width = Math.max(1, Math.floor(state.image.width * scale));
  els.stage.height = Math.max(1, Math.floor(state.image.height * scale));
}

function computeTransform() {
  if (!state.image) return;
  state.scale = Math.min(els.stage.width / state.image.width, els.stage.height / state.image.height);
  state.offsetX = 0;
  state.offsetY = 0;
}

function sourceToCanvas(point) {
  return {
    x: state.offsetX + point.x * state.scale,
    y: state.offsetY + point.y * state.scale,
  };
}

function canvasToSource(point) {
  return {
    x: Math.round((point.x - state.offsetX) / state.scale),
    y: Math.round((point.y - state.offsetY) / state.scale),
  };
}

function draw() {
  resizeCanvas();
  computeTransform();
  ctx.clearRect(0, 0, els.stage.width, els.stage.height);
  ctx.fillStyle = '#eef2f7';
  ctx.fillRect(0, 0, els.stage.width, els.stage.height);
  if (!state.image) return;

  ctx.drawImage(
    state.image,
    state.offsetX,
    state.offsetY,
    state.image.width * state.scale,
    state.image.height * state.scale,
  );

  const items = itemsForSource();
  items.forEach((item, index) => {
    drawBox(item, index === state.selectedIndex);
  });
}

function drawBox(item, active) {
  const [x1, y1, x2, y2] = item.box;
  const a = sourceToCanvas({ x: x1, y: y1 });
  const b = sourceToCanvas({ x: x2, y: y2 });
  ctx.save();
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.strokeStyle = active ? '#2563eb' : 'rgba(37, 99, 235, 0.55)';
  ctx.fillStyle = active ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.03)';
  ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);

  ctx.fillStyle = active ? '#2563eb' : 'rgba(37, 99, 235, 0.75)';
  ctx.fillRect(a.x, a.y - 21, Math.max(54, item.word.length * 8 + 14), 20);
  ctx.fillStyle = '#fff';
  ctx.font = '12px system-ui';
  ctx.fillText(item.word, a.x + 7, a.y - 7);

  if (active) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2563eb';
    for (const p of [
      [a.x, a.y],
      [b.x, a.y],
      [a.x, b.y],
      [b.x, b.y],
    ]) {
      ctx.beginPath();
      ctx.rect(p[0] - 5, p[1] - 5, 10, 10);
      ctx.fill();
      ctx.stroke();
    }
    for (const [eraseIndex, rect] of (item.erase || []).entries()) {
      const e1 = sourceToCanvas({ x: x1 + rect[0], y: y1 + rect[1] });
      const e2 = sourceToCanvas({ x: x1 + rect[0] + rect[2], y: y1 + rect[1] + rect[3] });
      const selected = eraseIndex === state.selectedEraseIndex;
      ctx.fillStyle = selected ? 'rgba(220, 38, 38, 0.26)' : 'rgba(220, 38, 38, 0.18)';
      ctx.strokeStyle = selected ? '#991b1b' : '#dc2626';
      ctx.lineWidth = selected ? 3 : 2;
      ctx.fillRect(e1.x, e1.y, e2.x - e1.x, e2.y - e1.y);
      ctx.strokeRect(e1.x, e1.y, e2.x - e1.x, e2.y - e1.y);
      if (selected) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#991b1b';
        for (const p of [
          [e1.x, e1.y],
          [e2.x, e1.y],
          [e1.x, e2.y],
          [e2.x, e2.y],
        ]) {
          ctx.beginPath();
          ctx.rect(p[0] - 4, p[1] - 4, 8, 8);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}

function pointer(event) {
  const rect = els.stage.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function hitCropHandle(item, p) {
  const [x1, y1, x2, y2] = item.box;
  const a = sourceToCanvas({ x: x1, y: y1 });
  const b = sourceToCanvas({ x: x2, y: y2 });
  const threshold = 10;
  const nearLeft = Math.abs(p.x - a.x) < threshold;
  const nearRight = Math.abs(p.x - b.x) < threshold;
  const nearTop = Math.abs(p.y - a.y) < threshold;
  const nearBottom = Math.abs(p.y - b.y) < threshold;
  if (nearLeft && nearTop) return 'nw';
  if (nearRight && nearTop) return 'ne';
  if (nearLeft && nearBottom) return 'sw';
  if (nearRight && nearBottom) return 'se';
  if (p.x >= a.x && p.x <= b.x && p.y >= a.y && p.y <= b.y) return 'move';
  return 'new';
}

function hitEraseHandle(item, p) {
  const [cropX, cropY] = item.box;
  const threshold = 9;
  const erases = item.erase || [];
  for (let index = erases.length - 1; index >= 0; index -= 1) {
    const [x, y, w, h] = erases[index];
    const a = sourceToCanvas({ x: cropX + x, y: cropY + y });
    const b = sourceToCanvas({ x: cropX + x + w, y: cropY + y + h });
    const nearLeft = Math.abs(p.x - a.x) < threshold;
    const nearRight = Math.abs(p.x - b.x) < threshold;
    const nearTop = Math.abs(p.y - a.y) < threshold;
    const nearBottom = Math.abs(p.y - b.y) < threshold;
    if (nearLeft && nearTop) return { index, handle: 'nw' };
    if (nearRight && nearTop) return { index, handle: 'ne' };
    if (nearLeft && nearBottom) return { index, handle: 'sw' };
    if (nearRight && nearBottom) return { index, handle: 'se' };
    if (p.x >= a.x && p.x <= b.x && p.y >= a.y && p.y <= b.y) return { index, handle: 'move' };
  }
  return null;
}

function clampErase(item, rect) {
  const cropW = Math.max(1, item.box[2] - item.box[0]);
  const cropH = Math.max(1, item.box[3] - item.box[1]);
  let [x, y, w, h] = rect.map((v) => Math.round(v));
  if (w < 0) {
    x += w;
    w = Math.abs(w);
  }
  if (h < 0) {
    y += h;
    h = Math.abs(h);
  }
  x = Math.max(0, Math.min(cropW - 1, x));
  y = Math.max(0, Math.min(cropH - 1, y));
  w = Math.max(1, Math.min(cropW - x, w));
  h = Math.max(1, Math.min(cropH - y, h));
  return [x, y, w, h];
}

function defaultEraseForBox(box) {
  const w = Math.max(1, box[2] - box[0]);
  const h = Math.max(1, box[3] - box[1]);
  const size = Math.round(Math.min(w, h) * 0.22);
  return [[0, 0, size, size]];
}

function clampBox(box) {
  if (!state.image) return box;
  let [x1, y1, x2, y2] = box.map((v) => Math.round(v));
  x1 = Math.max(0, Math.min(state.image.width - 1, x1));
  y1 = Math.max(0, Math.min(state.image.height - 1, y1));
  x2 = Math.max(1, Math.min(state.image.width, x2));
  y2 = Math.max(1, Math.min(state.image.height, y2));
  if (x2 < x1) [x1, x2] = [x2, x1];
  if (y2 < y1) [y1, y2] = [y2, y1];
  if (x2 === x1) x2 += 1;
  if (y2 === y1) y2 += 1;
  return [x1, y1, x2, y2];
}

els.stage.addEventListener('mousedown', (event) => {
  const item = selectedItem();
  if (!item || !state.image) return;
  const p = pointer(event);
  const s = canvasToSource(p);
  if (state.mode === 'erase') {
    const hit = hitEraseHandle(item, p);
    if (hit) {
      state.selectedEraseIndex = hit.index;
      state.drag = {
        type: 'erase-adjust',
        handle: hit.handle,
        start: s,
        original: [...item.erase[hit.index]],
      };
    } else {
      state.selectedEraseIndex = -1;
      state.drag = { type: 'erase-new', start: s, current: s };
    }
  } else {
    state.selectedEraseIndex = -1;
    const handle = hitCropHandle(item, p);
    state.drag = { type: 'crop', handle, start: s, original: [...item.box] };
  }
});

window.addEventListener('mousemove', (event) => {
  if (!state.drag) return;
  const item = selectedItem();
  if (!item) return;
  const p = pointer(event);
  const s = canvasToSource(p);
  if (state.drag.type === 'erase-new') {
    state.drag.current = s;
  } else if (state.drag.type === 'erase-adjust') {
    updateEraseDrag(item, s);
  } else {
    updateCropDrag(item, s);
  }
  syncEditorFromItem();
  draw();
  if (state.drag.type === 'erase-new') drawPendingErase();
});

window.addEventListener('mouseup', () => {
  const item = selectedItem();
  if (state.drag?.type === 'erase-new' && item) {
    const [x1, y1] = item.box;
    const a = state.drag.start;
    const b = state.drag.current;
    const left = Math.max(0, Math.min(a.x, b.x) - x1);
    const top = Math.max(0, Math.min(a.y, b.y) - y1);
    const width = Math.abs(b.x - a.x);
    const height = Math.abs(b.y - a.y);
    if (width > 3 && height > 3) {
      item.erase = item.erase || [];
      item.erase.push(clampErase(item, [left, top, width, height]));
      state.selectedEraseIndex = item.erase.length - 1;
    }
  }
  state.drag = null;
  syncEditorFromItem();
  draw();
});

function updateCropDrag(item, s) {
  const drag = state.drag;
  let [x1, y1, x2, y2] = drag.original;
  const dx = s.x - drag.start.x;
  const dy = s.y - drag.start.y;
  if (drag.handle === 'move') {
    item.box = clampBox([x1 + dx, y1 + dy, x2 + dx, y2 + dy]);
  } else if (drag.handle === 'nw') {
    item.box = clampBox([s.x, s.y, x2, y2]);
  } else if (drag.handle === 'ne') {
    item.box = clampBox([x1, s.y, s.x, y2]);
  } else if (drag.handle === 'sw') {
    item.box = clampBox([s.x, y1, x2, s.y]);
  } else if (drag.handle === 'se') {
    item.box = clampBox([x1, y1, s.x, s.y]);
  } else {
    item.box = clampBox([drag.start.x, drag.start.y, s.x, s.y]);
  }
}

function updateEraseDrag(item, s) {
  const drag = state.drag;
  const index = state.selectedEraseIndex;
  if (!drag || index < 0 || !item.erase?.[index]) return;
  let [x, y, w, h] = drag.original;
  const dx = s.x - drag.start.x;
  const dy = s.y - drag.start.y;
  if (drag.handle === 'move') {
    item.erase[index] = clampErase(item, [x + dx, y + dy, w, h]);
  } else if (drag.handle === 'nw') {
    item.erase[index] = clampErase(item, [x + dx, y + dy, w - dx, h - dy]);
  } else if (drag.handle === 'ne') {
    item.erase[index] = clampErase(item, [x, y + dy, w + dx, h - dy]);
  } else if (drag.handle === 'sw') {
    item.erase[index] = clampErase(item, [x + dx, y, w - dx, h + dy]);
  } else if (drag.handle === 'se') {
    item.erase[index] = clampErase(item, [x, y, w + dx, h + dy]);
  }
}

function drawPendingErase() {
  const item = selectedItem();
  if (!item || !state.drag) return;
  const a = sourceToCanvas(state.drag.start);
  const b = sourceToCanvas(state.drag.current);
  ctx.save();
  ctx.fillStyle = 'rgba(220, 38, 38, 0.16)';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  ctx.restore();
}

function syncEditorFromItem() {
  const item = selectedItem();
  if (!item) return;
  els.boxInput.value = item.box.join(', ');
}

function updateSelectedFromForm() {
  const item = selectedItem();
  if (!item) return;
  item.word = cleanWord(els.wordInput.value) || item.word;
  item.status = els.statusInput.value;
  item.eraseMode = els.eraseModeInput.value;
  item.notes = els.notesInput.value;
  const box = els.boxInput.value.split(',').map((part) => Number(part.trim()));
  if (box.length === 4 && box.every(Number.isFinite)) item.box = clampBox(box);
}

function cleanWord(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

for (const input of [els.wordInput, els.statusInput, els.eraseModeInput, els.boxInput, els.notesInput]) {
  input.addEventListener('change', () => {
    updateSelectedFromForm();
    renderWords();
    draw();
  });
}

els.addWordBtn.addEventListener('click', () => {
  if (!state.selectedSource) return;
  const item = {
    _localId: `item-${nextLocalId}`,
    _isNew: true,
    word: `word-${itemsForSource().length + 1}`,
    source: state.selectedSource.path,
    box: [20, 20, 140, 140],
    erase: defaultEraseForBox([20, 20, 140, 140]),
    eraseMode: 'transparent',
    status: 'draft',
    notes: '',
  };
  nextLocalId += 1;
  state.mapping.items.push(item);
  state.selectedIndex = itemsForSource().length - 1;
  renderWords();
  draw();
});

els.deleteWordBtn.addEventListener('click', () => {
  const item = selectedItem();
  if (!item) return;
  if (!item._isNew && !confirm(`Delete "${item.word}" from this source?`)) return;
  const allIndex = state.mapping.items.findIndex((candidate) => candidate === item || candidate._localId === item._localId);
  if (allIndex < 0) return;
  state.mapping.items.splice(allIndex, 1);
  state.selectedIndex = Math.max(0, Math.min(state.selectedIndex, itemsForSource().length - 1));
  state.selectedEraseIndex = -1;
  renderSources();
  renderWords();
  draw();
  setStatus(item._isNew ? `Canceled ${item.word}` : `Deleted ${item.word}`);
});

els.undoEraseBtn.addEventListener('click', () => {
  const item = selectedItem();
  if (!item?.erase?.length) return;
  if (state.selectedEraseIndex >= 0) {
    item.erase.splice(state.selectedEraseIndex, 1);
    state.selectedEraseIndex = Math.min(state.selectedEraseIndex, item.erase.length - 1);
  } else {
    item.erase.pop();
  }
  draw();
});

els.addDefaultEraseBtn.addEventListener('click', () => {
  const item = selectedItem();
  if (!item) return;
  item.erase = item.erase || [];
  item.erase.push(defaultEraseForBox(item.box)[0]);
  state.selectedEraseIndex = item.erase.length - 1;
  setMode('erase');
  draw();
});

els.cropModeBtn.addEventListener('click', () => setMode('crop'));
els.eraseModeBtn.addEventListener('click', () => setMode('erase'));

els.editor.addEventListener('submit', (event) => {
  event.preventDefault();
  updateSelectedFromForm();
  renderWords();
  draw();
});

function setMode(mode) {
  state.mode = mode;
  els.cropModeBtn.classList.toggle('active', mode === 'crop');
  els.eraseModeBtn.classList.toggle('active', mode === 'erase');
}

els.saveBtn.addEventListener('click', async () => {
  await runAction('Save', async () => {
    if (!ensureNoBlockingDuplicate('saving')) return;
    state.mapping = hydrateMapping(await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) }));
    renderSources();
    renderWords();
  });
});

els.seedSourceBtn.addEventListener('click', async () => {
  if (!state.selectedSource) return;
  await runAction('Seed Page', async () => {
    if (!ensureNoBlockingDuplicate('seeding')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    const result = await api('/api/seed-source', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path, replace: false }),
    });
    state.mapping = hydrateMapping(result.mapping);
    state.selectedIndex = 0;
    renderSources();
    renderWords();
    draw();
    const skipped = result.skippedExisting ? `, skipped ${result.skippedExisting} existing` : '';
    setStatus(`Seeded ${result.added} new${skipped}`, 'ok');
  });
});

els.numberEraseAllBtn.addEventListener('click', async () => {
  if (!state.selectedSource) return;
  await runAction('Number Erase All', async () => {
    if (!ensureNoBlockingDuplicate('applying number erase')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    const result = await api('/api/default-erases', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path }),
    });
    state.mapping = hydrateMapping(result.mapping);
    renderSources();
    renderWords();
    draw();
    setStatus(`Number erase ${result.changed}`, 'ok');
  });
});

els.autoRefineBtn.addEventListener('click', async () => {
  if (!state.selectedSource) return;
  await runAction('Auto Refine Page', async () => {
    if (!ensureNoBlockingDuplicate('auto refining')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    const result = await api('/api/auto-refine', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path }),
    });
    state.mapping = hydrateMapping(result.mapping);
    state.selectedIndex = Math.min(state.selectedIndex, itemsForSource().length - 1);
    state.selectedEraseIndex = -1;
    renderSources();
    renderWords();
    draw();
    setStatus(`Auto refined ${result.changed}`, 'ok');
  });
});

els.autoRefineWordBtn.addEventListener('click', async () => {
  const item = selectedItem();
  if (!state.selectedSource || !item) return;
  const word = item.word;
  await runAction('Refine Word', async () => {
    if (!ensureNoBlockingDuplicate('refining')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    const result = await api('/api/auto-refine', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path, word }),
    });
    state.mapping = hydrateMapping(result.mapping);
    keepSelectedWord(word);
    renderSources();
    renderWords();
    draw();
    setStatus(`Refined ${word}`, 'ok');
  });
});

els.resetWordBtn.addEventListener('click', async () => {
  const item = selectedItem();
  if (!state.selectedSource || !item) return;
  await runAction('Reset Word', async () => {
    if (!ensureNoBlockingDuplicate('resetting')) return;
    const current = selectedItem();
    if (!current) return;
    const word = current.word;
    const result = await api('/api/reset-word', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path, word }),
    });
    state.mapping = hydrateMapping(result.mapping);
    keepSelectedWord(word);
    renderSources();
    renderWords();
    draw();
    setStatus(`Reset ${word}`, 'ok');
  });
});

els.resetSourceBtn.addEventListener('click', async () => {
  if (!state.selectedSource) return;
  await runAction('Reset Page', async () => {
    const result = await api('/api/seed-source', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path, replace: true }),
    });
    state.mapping = hydrateMapping(result.mapping);
    state.selectedIndex = 0;
    state.selectedEraseIndex = -1;
    renderSources();
    renderWords();
    draw();
    setStatus(`Reset ${result.totalForSource}`, 'ok');
  });
});

els.renderWordBtn.addEventListener('click', async () => {
  await runAction('Preview', async () => {
    if (!ensureNoBlockingDuplicate('previewing')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    const item = selectedItem();
    if (!item) return;
    await api('/api/render', {
      method: 'POST',
      body: JSON.stringify({ source: item.source, word: item.word }),
    });
    els.previewImg.src = previewUrl(item);
  });
});

els.renderSourceBtn.addEventListener('click', async () => {
  await runAction('Render Page', async () => {
    if (!ensureNoBlockingDuplicate('rendering')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    if (!state.selectedSource) return;
    await api('/api/render', {
      method: 'POST',
      body: JSON.stringify({ source: state.selectedSource.path }),
    });
    await loadContactSheet();
  });
});

els.renderAllBtn.addEventListener('click', async () => {
  await runAction('Render All', async () => {
    if (!ensureNoBlockingDuplicate('rendering')) return;
    await api('/api/mapping', { method: 'POST', body: JSON.stringify(state.mapping) });
    if (!ensureNoBlockingDuplicate('rendering all', 'all')) return;
    await api('/api/render-all', { method: 'POST', body: '{}' });
    await loadContactSheet();
  });
});

els.contactBtn.addEventListener('click', loadContactSheet);

async function loadContactSheet() {
  if (!state.selectedSource) return;
  setStatus('Contact Sheet...');
  els.contactImg.src = `/api/contact-sheet?source=${encodeURIComponent(state.selectedSource.path)}&t=${Date.now()}`;
  setStatus('Contact Sheet done', 'ok');
}

window.addEventListener('keydown', async (event) => {
  const target = event.target;
  const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  if (!isTyping && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    setMode('crop');
  }
  if (!isTyping && event.key.toLowerCase() === 'e') {
    event.preventDefault();
    setMode('erase');
  }
  if (isTyping) return;
  const items = itemsForSource();
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectWord(Math.min(items.length - 1, state.selectedIndex + 1));
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectWord(Math.max(0, state.selectedIndex - 1));
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    els.saveBtn.click();
  }
  if (event.key.toLowerCase() === 'p') {
    event.preventDefault();
    els.renderWordBtn.click();
  }
});

async function init() {
  const [sourcesPayload, mapping] = await Promise.all([api('/api/sources'), api('/api/mapping')]);
  state.sources = sourcesPayload.sources;
  state.mapping = hydrateMapping(mapping);
  renderSources();
  if (state.sources.length) await selectSource(state.sources[0]);
}

window.addEventListener('resize', draw);
init().catch((error) => {
  alert(error.message);
  console.error(error);
});

function restoreSplitters() {
  const inspectorTop = localStorage.getItem('wordImageLab.inspectorTop');
  const previewLeft = localStorage.getItem('wordImageLab.previewLeft');
  if (inspectorTop) els.inspector.style.setProperty('--inspector-top', inspectorTop);
  if (previewLeft) els.previewBody.style.setProperty('--preview-left', previewLeft);
}

function setupSplitters() {
  restoreSplitters();

  els.inspectorSplit.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const startY = event.clientY;
    const inspectorRect = els.inspector.getBoundingClientRect();
    const topRect = document.querySelector('.inspectorTop').getBoundingClientRect();
    const startTop = topRect.height;

    function onMove(moveEvent) {
      const next = clamp(startTop + moveEvent.clientY - startY, 180, inspectorRect.height - 240);
      const value = `${Math.round(next)}px`;
      els.inspector.style.setProperty('--inspector-top', value);
      localStorage.setItem('wordImageLab.inspectorTop', value);
    }

    function onUp() {
      document.body.classList.remove('resizing');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    document.body.classList.add('resizing');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  els.previewSplit.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const bodyRect = els.previewBody.getBoundingClientRect();
    const leftRect = els.previewImg.getBoundingClientRect();
    const startLeft = leftRect.width;

    function onMove(moveEvent) {
      const next = clamp(startLeft + moveEvent.clientX - startX, 180, bodyRect.width - 180);
      const value = `${Math.round(next)}px`;
      els.previewBody.style.setProperty('--preview-left', value);
      localStorage.setItem('wordImageLab.previewLeft', value);
    }

    function onUp() {
      document.body.classList.remove('resizing');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    document.body.classList.add('resizing');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}

setupSplitters();
