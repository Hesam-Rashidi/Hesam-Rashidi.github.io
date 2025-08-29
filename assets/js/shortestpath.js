document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pathCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // Graph settings
  const NODE_COUNT = 9; // 3x3 grid graph for clarity on mobile as well
  const GRID_COLS = 3;
  const GRID_ROWS = 3;
  const EDGE_REVEAL_PER_CARD = 4; // number of hidden edges to reveal per card draw
  const EDGE_MIN_W = 1; // lower bound for hidden edge label and AI risk model
  const EDGE_MAX_W = 9; // upper bound for hidden edge label and AI risk model

  // Game state
  let nodes = [];
  let edges = []; // {u, v, w, revealed}
  let adj = [];   // adjacency list indices into edges
  let startNode = 0;
  let goalNode = NODE_COUNT - 1;
  let userPath = [startNode];
  let userCommitted = false;
  let fogEnabled = true;
  let cardsLeft = 5;
  let aiPath = [];
  let aiCost = null;

  // UI elements
  const spUserCost = document.getElementById('spUserCost');
  const spAICost = document.getElementById('spAICost');
  const btnNew = document.getElementById('spNewBtn');
  const btnCommit = document.getElementById('spCommitBtn');
  const btnFog = document.getElementById('spFogBtn');
  const btnSolve = document.getElementById('spSolveBtn');

  function resetState() {
    nodes = []; edges = []; adj = [];
    startNode = 0; goalNode = NODE_COUNT - 1;
    userPath = [startNode]; userCommitted = false; fogEnabled = true;
    cardsLeft = 5; aiPath = []; aiCost = null;
    if(spAICost) spAICost.textContent = '–';
    if(spUserCost) spUserCost.textContent = '0';
  }

  function layoutNodes() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width; const h = rect.height;
    const padX = 40; const padY = 40;
    const stepX = (w - padX * 2) / (GRID_COLS - 1);
    const stepY = (h - padY * 2) / (GRID_ROWS - 1);
    nodes = [];
    for(let r = 0; r < GRID_ROWS; r++){
      for(let c = 0; c < GRID_COLS; c++){
        const x = padX + c * stepX;
        const y = padY + r * stepY;
        nodes.push({ x, y });
      }
    }
  }

  function nodeIndex(r, c){ return r * GRID_COLS + c; }

  function buildGridEdges() {
    edges = []; adj = Array.from({length: NODE_COUNT}, () => []);
    // Connect 4-neighborhood (right and down to avoid duplicates)
    for(let r = 0; r < GRID_ROWS; r++){
      for(let c = 0; c < GRID_COLS; c++){
        const u = nodeIndex(r, c);
        if(c + 1 < GRID_COLS){
          const v = nodeIndex(r, c+1);
          addEdge(u, v);
        }
        if(r + 1 < GRID_ROWS){
          const v = nodeIndex(r+1, c);
          addEdge(u, v);
        }
      }
    }
  }

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  function addEdge(u, v){
    const w = randInt(EDGE_MIN_W, EDGE_MAX_W); // small integer weights for quick mental math
    const revealed = Math.random() < 0.25; // start with some info
    const { minW, maxW } = revealed ? { minW: w, maxW: w } : sampleRangeContaining(w);
    const id = edges.length;
    edges.push({ u, v, w, revealed, minW, maxW });
    adj[u].push(id); adj[v].push(id);
  }

  // Pick a fun range length and center it so that it contains w and stays within bounds
  function sampleRangeContaining(w){
    // Bias towards mid-sized ranges for variety
    const possibleLens = [2, 3, 4, 5];
    const lensWeights = [2, 3, 3, 2];
    const total = lensWeights.reduce((a,b) => a+b, 0);
    const r = Math.random() * total;
    let acc = 0; let chosenLen = possibleLens[0];
    for(let i = 0; i < possibleLens.length; i++){
      acc += lensWeights[i];
      if(r <= acc){ chosenLen = possibleLens[i]; break; }
    }
    // Place the range around w with random offset while keeping within bounds
    const maxStart = Math.min(w, EDGE_MAX_W - chosenLen + 1);
    const minStart = Math.max(EDGE_MIN_W, w - chosenLen + 1);
    const start = randInt(minStart, maxStart);
    const end = start + chosenLen - 1;
    return { minW: start, maxW: end };
  }

  function dijkstra(start, goal){
    const dist = Array(NODE_COUNT).fill(Infinity);
    const prev = Array(NODE_COUNT).fill(-1);
    dist[start] = 0;
    const visited = new Set();
    // Min-heap via simple array for tiny graphs
    const pq = [{ node: start, d: 0 }];
    while(pq.length){
      pq.sort((a,b) => a.d - b.d);
      const { node: u, d } = pq.shift();
      if(visited.has(u)) continue; visited.add(u);
      if(u === goal) break;
      for(const eid of adj[u]){
        const e = edges[eid];
        const v = e.u === u ? e.v : e.u;
        const nd = d + e.w;
        if(nd < dist[v]){ dist[v] = nd; prev[v] = u; pq.push({ node: v, d: nd }); }
      }
    }
    if(!isFinite(dist[goal])) return { path: [], cost: Infinity };
    const path = [];
    for(let at = goal; at !== -1; at = prev[at]) path.push(at);
    path.reverse();
    return { path, cost: dist[goal] };
  }

  // Risk-taking AI: for hidden edges, assume optimistic cost (lower bound of range)
  function dijkstraRisky(start, goal){
    const dist = Array(NODE_COUNT).fill(Infinity);
    const prev = Array(NODE_COUNT).fill(-1);
    dist[start] = 0;
    const visited = new Set();
    const pq = [{ node: start, d: 0 }];
    while(pq.length){
      pq.sort((a,b) => a.d - b.d);
      const { node: u, d } = pq.shift();
      if(visited.has(u)) continue; visited.add(u);
      if(u === goal) break;
      for(const eid of adj[u]){
        const e = edges[eid];
        const v = e.u === u ? e.v : e.u;
        const wEff = e.revealed ? e.w : e.minW;
        const nd = d + wEff;
        if(nd < dist[v]){ dist[v] = nd; prev[v] = u; pq.push({ node: v, d: nd }); }
      }
    }
    if(!isFinite(dist[goal])) return { path: [], cost: Infinity };
    const path = [];
    for(let at = goal; at !== -1; at = prev[at]) path.push(at);
    path.reverse();
    return { path, cost: dist[goal] };
  }

  function revealSomeEdges(count){
    const hidden = edges.filter(e => !e.revealed);
    for(let i = 0; i < count && hidden.length; i++){
      const idx = Math.floor(Math.random() * hidden.length);
      hidden[idx].revealed = true;
      hidden.splice(idx, 1);
    }
  }

  function userCost(){
    let cost = 0;
    for(let i = 0; i + 1 < userPath.length; i++){
      const u = userPath[i];
      const v = userPath[i+1];
      const e = findEdge(u, v);
      if(!e) return Infinity;
      cost += e.w;
    }
    return cost;
  }

  function findEdge(u, v){
    for(const eid of adj[u]){
      const e = edges[eid];
      if((e.u === u && e.v === v) || (e.u === v && e.v === u)) return e;
    }
    return null;
  }

  function neighbors(u){
    const out = [];
    for(const eid of adj[u]){
      const e = edges[eid];
      const v = e.u === u ? e.v : e.u;
      out.push({ v, e });
    }
    return out;
  }

  function draw(){
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Edges
    for(const e of edges){
      const a = nodes[e.u];
      const b = nodes[e.v];
      const isOnUser = isEdgeOnPath(e, userPath);
      const isOnAI = aiPath.length ? isEdgeOnPath(e, aiPath) : false;
      ctx.lineWidth = isOnUser ? 4 : 2;
      if(isOnUser) ctx.strokeStyle = '#60a5fa';
      else if(isOnAI && userCommitted) ctx.strokeStyle = '#10b981';
      else ctx.strokeStyle = '#6b7280';
      ctx.globalAlpha = fogEnabled && !e.revealed && !isOnUser ? 0.35 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.globalAlpha = 1;

      // weight label: show actual if revealed/visible; otherwise show per-edge range for masked edges
      const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '12px ui-sans-serif, system-ui';
      if(!fogEnabled || e.revealed || userCommitted || isOnUser){
        ctx.fillText(String(e.w), mx + 6, my - 6);
      } else {
        const lo = e.minW ?? EDGE_MIN_W;
        const hi = e.maxW ?? EDGE_MAX_W;
        ctx.fillText(`${lo}–${hi}`, mx + 6, my - 6);
      }
    }

    // Nodes
    nodes.forEach((p, i) => {
      const isStart = i === startNode;
      const isGoal = i === goalNode;
      const inUser = userPath.includes(i);
      const inAI = aiPath.includes(i) && userCommitted;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
      ctx.fillStyle = isStart ? '#f59e0b' : (isGoal ? '#10b981' : (inUser ? '#60a5fa' : (inAI ? '#34d399' : '#374151')));
      ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#111827'; ctx.font = 'bold 12px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i+1), p.x, p.y);
    });

    // HUD banner when committed
    if(userCommitted){
      const uCost = userCost();
      const label = (aiCost !== null) ? `Your cost ${uCost}  |  AI cost ${aiCost}` : `Your cost ${uCost}`;
      const padding = 12;
      ctx.font = '600 14px ui-sans-serif, system-ui';
      const textWidth = ctx.measureText(label).width;
      const boxX = (rect.width - textWidth) / 2 - padding;
      const boxY = rect.height - 42;
      const boxW = textWidth + padding * 2; const boxH = 30;
      ctx.fillStyle = (aiCost !== null && uCost <= aiCost + 1) ? '#16a34a' : '#374151';
      ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, rect.width/2, boxY + boxH/2);
    }
  }

  function isEdgeOnPath(edge, path){
    for(let i = 0; i + 1 < path.length; i++){
      const u = path[i], v = path[i+1];
      if((edge.u === u && edge.v === v) || (edge.u === v && edge.v === u)) return true;
    }
    return false;
  }

  function nearestNode(x, y){
    let best = -1; let bd = 1e9;
    for(let i = 0; i < nodes.length; i++){
      const dx = nodes[i].x - x, dy = nodes[i].y - y; const d = dx*dx + dy*dy;
      if(d < bd){ bd = d; best = i; }
    }
    return best;
  }

  function canExtend(to){
    const from = userPath[userPath.length - 1];
    return neighbors(from).some(n => n.v === to);
  }

  function handleClick(evt){
    if(userCommitted) return;
    const rect = canvas.getBoundingClientRect();
    const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left;
    const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) - rect.top;
    const n = nearestNode(x, y);
    if(n === -1) return;
    if(userPath.length && n === userPath[userPath.length-1]) return;
    // No backtracking allowed
    if(userPath.includes(n)) return;
    // Otherwise, extend only to unvisited adjacent node
    if(canExtend(n)){
      userPath.push(n);
      updateHUD();
      // Auto-commit when reaching goal
      if(n === goalNode){
        autoCommit();
      }
      draw();
    }
  }

  function updateHUD(){
    if(spUserCost) spUserCost.textContent = String(userCost());
  }

  function newGame(){
    resetState();
    layoutNodes();
    buildGridEdges();
    // Reveal a few edges near start to orient the player (no cards/draws anymore)
    revealSomeEdges(3);
    updateHUD();
    draw();
  }

  function autoCommit(){
    userCommitted = true;
    // Reveal all edges to show actual weights
    edges.forEach(e => e.revealed = true);
    const res = dijkstra(startNode, goalNode);
    aiPath = res.path; aiCost = res.cost;
    if(spAICost) spAICost.textContent = String(aiCost);
  }

  // Controls
  if(btnNew) btnNew.addEventListener('click', () => newGame());
  // draw button removed
  // commit button removed; commit happens automatically on reaching goal
  // fog toggle removed
  if(btnSolve) btnSolve.addEventListener('click', () => {
    // Risk-taking AI: choose route assuming optimistic costs for masked edges
    const res = dijkstraRisky(startNode, goalNode);
    aiPath = res.path; aiCost = res.cost;
    if(spAICost) spAICost.textContent = String(aiCost);
    draw();
  });

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchstart', (e) => { handleClick(e); }, { passive: true });

  const ro = new ResizeObserver(() => { layoutNodes(); draw(); });
  ro.observe(canvas);

  // Initialize
  newGame();
});


