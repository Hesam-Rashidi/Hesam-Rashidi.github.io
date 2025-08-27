document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pathCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // Graph settings
  const NODE_COUNT = 9; // 3x3 grid graph for clarity on mobile as well
  const GRID_COLS = 3;
  const GRID_ROWS = 3;
  const EDGE_REVEAL_PER_CARD = 4; // number of hidden edges to reveal per card draw

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
  const spCards = document.getElementById('spCards');
  const spUserCost = document.getElementById('spUserCost');
  const spAICost = document.getElementById('spAICost');
  const btnNew = document.getElementById('spNewBtn');
  const btnDraw = document.getElementById('spDrawBtn');
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
    if(spCards) spCards.textContent = String(cardsLeft);
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
    const w = randInt(1, 9); // small integer weights for quick mental math
    const revealed = Math.random() < 0.25; // start with some info
    const id = edges.length;
    edges.push({ u, v, w, revealed });
    adj[u].push(id); adj[v].push(id);
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

      // weight label (shown if revealed or on committed/ai path)
      if(!fogEnabled || e.revealed || userCommitted || isOnUser){
        const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '12px ui-sans-serif, system-ui';
        ctx.fillText(String(e.w), mx + 6, my - 6);
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
      const label = (aiCost !== null) ? `Your cost ${uCost}  |  Optimal ${aiCost}` : `Your cost ${uCost}`;
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
    if(canExtend(n)){
      userPath.push(n);
      updateHUD();
      draw();
    } else {
      // If clicked an earlier node on the path, allow backtracking
      const idx = userPath.indexOf(n);
      if(idx !== -1 && idx < userPath.length - 1){
        userPath = userPath.slice(0, idx + 1);
        updateHUD();
        draw();
      }
    }
  }

  function updateHUD(){
    if(spUserCost) spUserCost.textContent = String(userCost());
    if(spCards) spCards.textContent = String(cardsLeft);
  }

  function newGame(){
    resetState();
    layoutNodes();
    buildGridEdges();
    // Reveal a few edges near start to orient the player
    revealSomeEdges(3);
    updateHUD();
    draw();
  }

  function commitRoute(){
    if(userPath[userPath.length - 1] !== goalNode) return; // must reach goal first
    userCommitted = true;
    // Reveal all edges to show optimal
    edges.forEach(e => e.revealed = true);
    const res = dijkstra(startNode, goalNode);
    aiPath = res.path; aiCost = res.cost;
    if(spAICost) spAICost.textContent = String(aiCost);
    draw();
  }

  // Controls
  if(btnNew) btnNew.addEventListener('click', () => newGame());
  if(btnDraw) btnDraw.addEventListener('click', () => {
    if(userCommitted) return;
    if(cardsLeft <= 0) return;
    cardsLeft -= 1;
    revealSomeEdges(EDGE_REVEAL_PER_CARD);
    updateHUD();
    draw();
  });
  if(btnCommit) btnCommit.addEventListener('click', commitRoute);
  if(btnFog) btnFog.addEventListener('click', () => { fogEnabled = !fogEnabled; draw(); });
  if(btnSolve) btnSolve.addEventListener('click', () => {
    // Show AI path without forcing commit: softly reveal AI path but do not reveal all weights
    const res = dijkstra(startNode, goalNode);
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


