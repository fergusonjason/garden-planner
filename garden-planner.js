// ─── State ────────────────────────────────────────────────────────────────────
let COLS = 40, ROWS = 25;
let currentZone = null;
let currentPlantColor = null;
let currentPlantName  = null;
let selectedPlantRow  = null;
let isPainting = false;
let paintedCount = 0;
let nextCol = 0;

// ─── Plant database ───────────────────────────────────────────────────────────
const PLANTS = {
  bean:        { rowWidth:1, gap:2, color:'#7a9a4a', notes:'Bush or pole types',     aliases:['beans','bean','green bean','green beans'] },
  beet:        { rowWidth:1, gap:1, color:'#8a2a5a', notes:'Thin to 3 in apart',     aliases:['beets','beet','beetroot'] },
  broccoli:    { rowWidth:2, gap:2, color:'#3a6a4a', notes:'Side shoots continue',   aliases:['broccoli'] },
  cabbage:     { rowWidth:2, gap:2, color:'#4a7a5a', notes:'Large heads',            aliases:['cabbage','cabbages'] },
  carrot:      { rowWidth:1, gap:1, color:'#d4782a', notes:'Deep loose soil',        aliases:['carrots','carrot'] },
  cauliflower: { rowWidth:2, gap:2, color:'#c8c8a0', notes:'Blanch heads',           aliases:['cauliflower'] },
  corn:        { rowWidth:1, gap:2, color:'#c9a84c', notes:'Plant in blocks',        aliases:['corn','maize','sweetcorn'] },
  cowpea:      { rowWidth:1, gap:2, color:'#8faa5a', notes:'Heat-tolerant legume',   aliases:['cowpeas','cowpea','black-eyed peas','black eyed peas','southern peas'] },
  cucumber:    { rowWidth:2, gap:3, color:'#4a8a2a', notes:'Trellis saves space',    aliases:['cucumbers','cucumber'] },
  eggplant:    { rowWidth:2, gap:3, color:'#6a3a8a', notes:'Needs heat',             aliases:['eggplant','aubergine'] },
  garlic:      { rowWidth:1, gap:1, color:'#c8b898', notes:'Fall planting',          aliases:['garlic'] },
  herb:        { rowWidth:1, gap:1, color:'#7aba8a', notes:'Mixed herb rows',        aliases:['herbs','herb','basil','parsley','cilantro','mint','thyme','oregano','rosemary','dill'] },
  kale:        { rowWidth:1, gap:2, color:'#3a7a3a', notes:'Cold-hardy',             aliases:['kale'] },
  lettuce:     { rowWidth:1, gap:1, color:'#5a9e4a', notes:'Partial shade ok',       aliases:['lettuce','salad'] },
  melon:       { rowWidth:3, gap:5, color:'#8aba4a', notes:'Needs warm season',      aliases:['melons','melon','watermelon','cantaloupe'] },
  onion:       { rowWidth:1, gap:1, color:'#b89a7a', notes:'From sets or seed',      aliases:['onions','onion'] },
  pea:         { rowWidth:1, gap:2, color:'#6a9a5a', notes:'Cool season, trellis',   aliases:['peas','pea'] },
  pepper:      { rowWidth:1, gap:2, color:'#c4632a', notes:'Full sun',               aliases:['peppers','pepper','capsicum'] },
  potato:      { rowWidth:1, gap:3, color:'#a89060', notes:'Hilled rows',            aliases:['potatoes','potato'] },
  pumpkin:     { rowWidth:4, gap:6, color:'#d06a20', notes:'Very large sprawl',      aliases:['pumpkins','pumpkin'] },
  radish:      { rowWidth:1, gap:1, color:'#c84a7a', notes:'30-day quick crop',      aliases:['radishes','radish'] },
  spinach:     { rowWidth:1, gap:1, color:'#4a8a4a', notes:'Cool season',            aliases:['spinach'] },
  strawberry:  { rowWidth:1, gap:2, color:'#c84a5a', notes:'Matted or hill system',  aliases:['strawberries','strawberry'] },
  sunflower:   { rowWidth:1, gap:2, color:'#e8c020', notes:'Tall — plant at N end',  aliases:['sunflowers','sunflower'] },
  tomato:      { rowWidth:2, gap:4, color:'#b84a3a', notes:'Stake or cage',          aliases:['tomatoes','tomato'] },
  zucchini:    { rowWidth:3, gap:4, color:'#3a7a2a', notes:'Sprawling habit',        aliases:['zucchini','courgette','squash'] },
};

// ─── Build modal table ────────────────────────────────────────────────────────
const tbody = document.getElementById('plant-table-body');
Object.entries(PLANTS).forEach(([key, p]) => {
  const sep = p.gap - p.rowWidth;
  const tr = document.createElement('tr');
  tr.className = 'clickable';
  tr.title = `Click to draw with ${p.aliases[0]} color`;
  tr.innerHTML = `
    <td style="white-space:nowrap">
      <span class="plant-color-dot" style="background:${p.color}"></span>
      <span class="plant-name">${p.aliases[0]}</span>
    </td>
    <td class="plant-num">${p.rowWidth} ft</td>
    <td class="plant-num">${sep} ft</td>
    <td class="plant-notes">${p.notes}</td>
    <td class="plant-aliases">${p.aliases.slice(0,4).join(', ')}</td>
  `;
  tr.addEventListener('click', () => selectPlant(key, p, tr));
  tbody.appendChild(tr);
});

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal()  { document.getElementById('modal-backdrop').classList.add('open'); }
function closeModal() { document.getElementById('modal-backdrop').classList.remove('open'); }
function closeModalBackdrop(e) {
  if (e.target === document.getElementById('modal-backdrop')) closeModal();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function selectPlant(key, plant, tr) {
  if (selectedPlantRow) selectedPlantRow.classList.remove('selected-plant');
  selectedPlantRow = tr;
  tr.classList.add('selected-plant');

  currentPlantColor = plant.color;
  currentPlantName  = plant.aliases[0];
  currentZone = null;

  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));

  const bar = document.getElementById('plant-active-bar');
  bar.style.display = 'flex';
  document.getElementById('plant-active-dot').style.background = plant.color;
  document.getElementById('plant-active-name').textContent = plant.aliases[0];

  closeModal();
}

function clearPlantMode() {
  currentPlantColor = null;
  currentPlantName  = null;
  currentZone = null;
  if (selectedPlantRow) { selectedPlantRow.classList.remove('selected-plant'); selectedPlantRow = null; }
  document.getElementById('plant-active-bar').style.display = 'none';
  // Re-select tomatoes in the toolbar
  const firstBtn = document.querySelector('.tool-btn[data-plant="tomato"]');
  if (firstBtn) {
    firstBtn.classList.add('active');
    currentPlantColor = PLANTS['tomato'].color;
    currentPlantName  = 'tomatoes';
    document.getElementById('plant-active-bar').style.display = 'flex';
    document.getElementById('plant-active-dot').style.background = PLANTS['tomato'].color;
    document.getElementById('plant-active-name').textContent = 'tomatoes';
  }
}

// ─── Build grid ───────────────────────────────────────────────────────────────
function buildGrid() {
  const grid   = document.getElementById('garden-grid');
  const rulerX = document.getElementById('ruler-x');
  const rulerY = document.getElementById('ruler-y');

  grid.innerHTML = '';
  rulerX.innerHTML = '';
  rulerY.innerHTML = '';

  grid.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
  grid.style.gridTemplateRows    = `repeat(${ROWS}, var(--cell-size))`;

  for (let c = 0; c < COLS; c++) {
    const d = document.createElement('div');
    d.className = 'ruler-cell' + ((c + 1) % 5 === 0 ? ' labeled' : '');
    d.textContent = (c + 1) % 5 === 0 ? c + 1 : '';
    rulerX.appendChild(d);
  }

  for (let r = 0; r < ROWS; r++) {
    const d = document.createElement('div');
    d.className = 'ruler-cell' + ((r + 1) % 5 === 0 ? ' labeled' : '');
    d.textContent = (r + 1) % 5 === 0 ? r + 1 : '';
    rulerY.appendChild(d);
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if ((c + 1) % 5 === 0 && c + 1 < COLS) cell.classList.add('mark-col');
      if ((r + 1) % 5 === 0 && r + 1 < ROWS) cell.classList.add('mark-row');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('mouseenter', () => {
        document.getElementById('coord-display').textContent = `X=${c + 1} ft,  Y=${r + 1} ft`;
        if (isPainting) paint(cell);
      });
      cell.addEventListener('mousedown', e => {
        e.preventDefault();
        isPainting = true;
        paint(cell);
      });
      cell.addEventListener('contextmenu', e => {
        e.preventDefault();
        eraseCell(cell);
      });
      grid.appendChild(cell);
    }
  }

  paintedCount = 0;
  nextCol = 0;
  document.getElementById('area-display').textContent = 'Planted: 0 sq ft';
  document.getElementById('cmd-feedback').textContent = '';
  updateSubtitle();
}

function updateSubtitle() {
  const sqft = COLS * ROWS;
  document.getElementById('header-subtitle').textContent =
    `${COLS} ft \u00d7 ${ROWS} ft \u00b7 ${sqft.toLocaleString()} sq ft \u00b7 1 cell = 1 sq ft`;
  document.title = `Garden Planner \u2014 ${COLS}\u00d7${ROWS} ft`;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────
function applyDimensions() {
  const c = parseInt(document.getElementById('inp-cols').value) || 40;
  const r = parseInt(document.getElementById('inp-rows').value) || 25;
  COLS = Math.min(200, Math.max(5, c));
  ROWS = Math.min(200, Math.max(5, r));
  document.getElementById('inp-cols').value = COLS;
  document.getElementById('inp-rows').value = ROWS;
  document.getElementById('dim-warning').style.display = 'none';
  buildGrid();
}

['inp-cols', 'inp-rows'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById('dim-warning').style.display = 'inline';
  });
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') applyDimensions();
  });
});

// ─── Paint ────────────────────────────────────────────────────────────────────
document.addEventListener('mouseup', () => isPainting = false);

function eraseCell(cell) {
  if (cell.dataset.zone || cell.dataset.customColor) {
    delete cell.dataset.zone;
    delete cell.dataset.customColor;
    cell.style.background = '';
    paintedCount = Math.max(0, paintedCount - 1);
    document.getElementById('area-display').textContent = `Planted: ${paintedCount} sq ft`;
  }
}

function paint(cell) {
  const hadColor = cell.dataset.zone || cell.dataset.customColor;

  if (currentPlantColor) {
    if (!hadColor) paintedCount++;
    cell.style.background = currentPlantColor;
    cell.dataset.zone = 'custom';
    cell.dataset.customColor = currentPlantColor;
  } else if (currentZone === 'erase') {
    if (hadColor) {
      delete cell.dataset.zone;
      delete cell.dataset.customColor;
      cell.style.background = '';
      paintedCount = Math.max(0, paintedCount - 1);
    }
  } else {
    if (!hadColor) paintedCount++;
    cell.dataset.zone = currentZone;
    delete cell.dataset.customColor;
    cell.style.background = '';
  }
  document.getElementById('area-display').textContent = `Planted: ${paintedCount} sq ft`;
}

document.getElementById('toolbar').addEventListener('click', e => {
  const btn = e.target.closest('.tool-btn');
  if (!btn) return;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const plantKey = btn.dataset.plant;
  if (plantKey === 'erase') {
    currentZone = 'erase';
    currentPlantColor = null;
    currentPlantName  = null;
  } else {
    const p = PLANTS[plantKey];
    currentZone = null;
    currentPlantColor = p.color;
    currentPlantName  = p.aliases[0];
  }

  const bar = document.getElementById('plant-active-bar');
  if (currentPlantColor) {
    bar.style.display = 'flex';
    document.getElementById('plant-active-dot').style.background = currentPlantColor;
    document.getElementById('plant-active-name').textContent = currentPlantName;
  } else {
    bar.style.display = 'none';
  }

  if (selectedPlantRow) { selectedPlantRow.classList.remove('selected-plant'); selectedPlantRow = null; }
});

// ─── Clear ────────────────────────────────────────────────────────────────────
function clearGrid() {
  if (!confirm('Clear the entire garden? This cannot be undone.')) return;
  document.querySelectorAll('.cell').forEach(c => {
    delete c.dataset.zone;
    delete c.dataset.customColor;
    c.style.background = '';
  });
  paintedCount = 0;
  nextCol = 0;
  document.getElementById('area-display').textContent = 'Planted: 0 sq ft';
  document.getElementById('cmd-feedback').textContent = '';
}

// ─── Plant command ────────────────────────────────────────────────────────────
function findPlant(text) {
  const t = text.toLowerCase();
  for (const [key, p] of Object.entries(PLANTS)) {
    if (p.aliases.some(a => t.includes(a))) return { key, ...p };
  }
  return null;
}

function createRows(count, plant, startAt = null) {
  const start = startAt !== null ? startAt : nextCol;
  const totalWidth = plant.rowWidth + (count - 1) * plant.gap;
  if (start + totalWidth > COLS) {
    return { ok:false, msg:`\u2717 Not enough space \u2014 only ${COLS - start} ft remaining from X=${start + 1}.` };
  }

  const cells = document.querySelectorAll('.cell');
  for (let i = 0; i < count; i++) {
    const startCol = start + i * plant.gap;
    for (let row = 0; row < ROWS; row++) {
      for (let w = 0; w < plant.rowWidth; w++) {
        const col = startCol + w;
        if (col >= COLS) continue;
        const cell = cells[row * COLS + col];
        if (!cell.dataset.customColor && !cell.dataset.zone) paintedCount++;
        cell.style.background = plant.color;
        cell.dataset.zone = 'custom';
        cell.dataset.customColor = plant.color;
      }
    }
  }

  const endCol = start + totalWidth;
  // Only advance nextCol if we planted at or past the current cursor
  if (endCol > nextCol) nextCol = endCol;

  const sep = plant.gap - plant.rowWidth;
  document.getElementById('area-display').textContent = `Planted: ${paintedCount} sq ft`;
  return {
    ok: true,
    msg: `\u2713 Planted ${count} row${count > 1 ? 's' : ''} of ${plant.aliases[0]} \u2014 ${plant.rowWidth}ft wide, ${sep}ft gap \u2014 X=${start + 1}\u2013${endCol}ft. Next free: X=${nextCol + 1}ft.`
  };
}

function runCommand() {
  const raw = document.getElementById('cmd-input').value.toLowerCase().trim();
  const fb  = document.getElementById('cmd-feedback');
  if (!raw) return;

  // Parse count
  const wordNums = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
  let count = 1;
  const numMatch = raw.match(/\b(\d+)\b/);
  if (numMatch) {
    count = parseInt(numMatch[1]);
  } else {
    for (const [w, n] of Object.entries(wordNums)) {
      if (new RegExp(`\\b${w}\\b`).test(raw)) { count = n; break; }
    }
  }

  // Parse optional start position — "at 10", "starting at 10", "from 10", "at x=10", "at x 10"
  let startAt = null;
  const startMatch = raw.match(/(?:starting\s+at|start(?:ing)?\s+(?:at\s+)?|from\s+|at\s+)(?:x\s*[=:]?\s*)?(\d+)/);
  if (startMatch) {
    startAt = parseInt(startMatch[1]) - 1; // convert 1-based user input to 0-based index
    if (startAt < 0) startAt = 0;
    if (startAt >= COLS) {
      fb.className = 'feedback-err';
      fb.textContent = `\u2717 Start position X=${startAt + 1} is outside the garden (max X=${COLS}).`;
      return;
    }
  }

  const plant = findPlant(raw);
  if (!plant) {
    fb.className = 'feedback-err';
    fb.textContent = '\u2717 Plant not recognized. Click \u201cSpacing Guide\u201d to see all options.';
    return;
  }

  const result = createRows(count, plant, startAt);
  fb.className = result.ok ? 'feedback-ok' : 'feedback-err';
  fb.textContent = result.msg;
  document.getElementById('cmd-input').value = '';
}

document.getElementById('cmd-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') runCommand();
});

// ─── Export PNG ───────────────────────────────────────────────────────────────
function exportPNG() {
  const cellPx = 18, padLeft = 32, padTop = 30;
  const canvas = document.createElement('canvas');
  canvas.width  = COLS * cellPx + padLeft + 4;
  canvas.height = ROWS * cellPx + padTop  + 4;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a1209';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e8c96d';
  ctx.font = 'bold 13px serif';
  ctx.fillText(`Garden Plan \u2014 ${COLS} ft \u00d7 ${ROWS} ft`, 10, 17);

  const zoneColors = { bed:'#6b3a2a', path:'#8b7355', lawn:'#3d6b45', water:'#2a5a7c', compost:'#4a3a1a', flowers:'#7a3a5a' };

  document.querySelectorAll('.cell').forEach(cell => {
    const r = +cell.dataset.row, c = +cell.dataset.col;
    const custom = cell.dataset.customColor || cell.style.background;
    const zone   = cell.dataset.zone;
    ctx.fillStyle = (custom && custom !== '') ? custom : (zone ? (zoneColors[zone] || '#2a4a30') : '#2a4a30');
    ctx.fillRect(padLeft + c * cellPx, padTop + r * cellPx, cellPx, cellPx);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(padLeft + c * cellPx, padTop + r * cellPx, cellPx, cellPx);
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  for (let c = 5; c < COLS; c += 5) {
    ctx.beginPath();
    ctx.moveTo(padLeft + c * cellPx, padTop);
    ctx.lineTo(padLeft + c * cellPx, padTop + ROWS * cellPx);
    ctx.stroke();
  }
  for (let r = 5; r < ROWS; r += 5) {
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + r * cellPx);
    ctx.lineTo(padLeft + COLS * cellPx, padTop + r * cellPx);
    ctx.stroke();
  }

  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.strokeRect(padLeft, padTop, COLS * cellPx, ROWS * cellPx);

  ctx.fillStyle = '#c9a84c';
  ctx.font = '7px monospace';
  for (let c = 4; c < COLS; c += 5) ctx.fillText(c + 1, padLeft + c * cellPx - 4, padTop - 3);
  for (let r = 4; r < ROWS; r += 5) ctx.fillText(r + 1, 4, padTop + r * cellPx + cellPx / 2 + 3);

  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `garden-plan-${COLS}x${ROWS}.png`;
    a.click();
  });
}

function exportPDF() { window.print(); }

// ─── .garden save / load (gzipped XML, run-length encoded) ───────────────────
function buildXML() {
  const cells = document.querySelectorAll('.cell');
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<garden width="${COLS}" height="${ROWS}" version="1">`
  ];

  const painted = {};
  cells.forEach(cell => {
    const custom = cell.dataset.customColor;
    const zone   = cell.dataset.zone;
    if (!custom && !zone) return;
    let plant = null;
    if (custom) {
      plant = Object.keys(PLANTS).find(k => PLANTS[k].color === custom) || 'unknown';
    } else {
      plant = zone;
    }
    painted[`${cell.dataset.col},${cell.dataset.row}`] = plant;
  });

  for (let r = 0; r < ROWS; r++) {
    let runStart = 0;
    while (runStart < COLS) {
      const key   = `${runStart},${r}`;
      const plant = painted[key] || null;
      if (!plant) { runStart++; continue; }
      let len = 1;
      while (runStart + len < COLS && (painted[`${runStart + len},${r}`] || null) === plant) len++;
      lines.push(`  <span x="${runStart}" y="${r}" len="${len}" plant="${plant}"/>`);
      runStart += len;
    }
  }

  lines.push(`</garden>`);
  return lines.join('\n');
}

async function savePlan() {
  const xml = buildXML();
  const encoded = new TextEncoder().encode(xml);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();
  const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());

  const blob = new Blob([compressed], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `garden-plan-${COLS}x${ROWS}.garden`;
  a.click();
  URL.revokeObjectURL(a.href);

  setFeedback(`\u2713 Saved garden-plan-${COLS}x${ROWS}.garden (${(compressed.byteLength / 1024).toFixed(1)} KB gzipped)`, 'feedback-ok');
}

async function loadPlan(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  try {
    const buffer = await file.arrayBuffer();

    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(new Uint8Array(buffer));
    writer.close();
    const xml = await new Response(ds.readable).text();

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const parseErr = doc.querySelector('parsererror');
    if (parseErr) throw new Error('Invalid XML in .garden file');

    const garden = doc.querySelector('garden');
    const newCols = parseInt(garden.getAttribute('width'));
    const newRows = parseInt(garden.getAttribute('height'));
    if (!newCols || !newRows) throw new Error('Missing width/height in .garden file');

    COLS = newCols;
    ROWS = newRows;
    document.getElementById('inp-cols').value = COLS;
    document.getElementById('inp-rows').value = ROWS;
    buildGrid();

    const cellEls = document.querySelectorAll('.cell');
    let count = 0;

    doc.querySelectorAll('span').forEach(span => {
      const x     = parseInt(span.getAttribute('x'));
      const y     = parseInt(span.getAttribute('y'));
      const len   = parseInt(span.getAttribute('len'));
      const plant = span.getAttribute('plant');
      const color = PLANTS[plant] ? PLANTS[plant].color : null;

      for (let i = 0; i < len; i++) {
        const col = x + i;
        if (col >= COLS || y >= ROWS) continue;
        const cell = cellEls[y * COLS + col];
        if (!cell) continue;
        if (color) {
          cell.style.background = color;
          cell.dataset.zone = 'custom';
          cell.dataset.customColor = color;
        } else {
          cell.dataset.zone = plant;
        }
        count++;
      }
    });

    paintedCount = count;
    document.getElementById('area-display').textContent = `Planted: ${count} sq ft`;
    setFeedback(`\u2713 Loaded ${file.name} \u2014 ${COLS}\u00d7${ROWS} ft, ${count} sq ft planted`, 'feedback-ok');

  } catch (err) {
    setFeedback(`\u2717 Failed to load: ${err.message}`, 'feedback-err');
  }
}

function setFeedback(msg, cls) {
  const fb = document.getElementById('cmd-feedback');
  fb.textContent = msg;
  fb.className = cls;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
buildGrid();

currentPlantColor = PLANTS['tomato'].color;
currentPlantName  = 'tomatoes';
document.getElementById('plant-active-bar').style.display = 'flex';
document.getElementById('plant-active-dot').style.background = PLANTS['tomato'].color;
document.getElementById('plant-active-name').textContent = 'tomatoes';