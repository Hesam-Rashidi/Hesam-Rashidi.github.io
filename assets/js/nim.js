document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('nimCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // Game parameters
  const MAX_REMOVE_PER_TURN = 5; // slider max, clamped by selected pile size
  const PILE_CAPACITY = 15; // rearrangement constraint: resulting piles cannot exceed this size
  const PILE_COUNT = 4;

  // State
  let piles = [];
  let yourTurn = true;
  let selectedPile = -1;
  let removeAmount = 1;
  let userRearrangesLeft = 1;
  let aiRearrangesLeft = 1;
  let rearrangeMode = false;
  let rearrSelected = []; // two pile indices
  let rearrSplit = 0; // how many stones to move from A to B (signed)
  let lastMover = null; // 'You' or 'AI' to ensure accurate winner display

  // UI elements
  const turnEl = document.getElementById('nimTurn');
  const userRearrEl = document.getElementById('nimUserRearr');
  const aiRearrEl = document.getElementById('nimAIRearr');
  const selPileEl = document.getElementById('nimSelPile');
  const removeSlider = document.getElementById('nimRemove');
  const removeValEl = document.getElementById('nimRemoveVal');
  const removeBtn = document.getElementById('nimRemoveBtn');
  const btnNew = document.getElementById('nimNewBtn');
  const btnRearr = document.getElementById('nimRearrangeBtn');
  const btnCommit = document.getElementById('nimCommitBtn');
  const btnCancel = document.getElementById('nimCancelBtn');

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  function newGame(){
    piles = Array.from({length: PILE_COUNT}, () => randInt(3, 13));
    yourTurn = true; selectedPile = -1; removeAmount = 1;
    userRearrangesLeft = 1; aiRearrangesLeft = 1;
    rearrangeMode = false; rearrSelected = []; rearrSplit = 0;
    updateHUD();
    draw();
  }

  function updateHUD(){
    if(turnEl) turnEl.textContent = yourTurn ? 'You' : 'AI';
    if(userRearrEl) userRearrEl.textContent = String(userRearrangesLeft);
    if(aiRearrEl) aiRearrEl.textContent = String(aiRearrangesLeft);
    if(selPileEl) selPileEl.textContent = selectedPile === -1 ? '–' : String(selectedPile + 1);
    if(removeSlider){
      const max = selectedPile === -1 ? MAX_REMOVE_PER_TURN : Math.min(MAX_REMOVE_PER_TURN, piles[selectedPile]);
      removeSlider.max = String(Math.max(1, max));
      removeAmount = Math.min(removeAmount, parseInt(removeSlider.max));
      removeSlider.value = String(removeAmount);
    }
    if(removeValEl) removeValEl.textContent = String(removeAmount);
    btnCommit && (btnCommit.disabled = !(rearrangeMode && rearrSelected.length === 2));
    btnCancel && (btnCancel.disabled = !rearrangeMode);
  }

  function isGameOver(){ return piles.every(v => v === 0); }

  function draw(){
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const pad = 30;
    const gap = 20;
    const barW = Math.min(120, (rect.width - pad*2 - gap*(PILE_COUNT-1)) / PILE_COUNT);
    const barH = rect.height - pad*2;
    const scaleY = (v) => Math.max(4, (v / PILE_CAPACITY) * barH);

    for(let i = 0; i < piles.length; i++){
      const x = pad + i * (barW + gap);
      const y = rect.height - pad - scaleY(piles[i]);
      const isSel = i === selectedPile;
      const inRearr = rearrangeMode && rearrSelected.includes(i);
      ctx.fillStyle = inRearr ? '#10b981' : (isSel ? '#60a5fa' : '#4b5563');
      ctx.fillRect(x, y, barW, scaleY(piles[i]));
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.strokeRect(x, rect.height - pad - barH, barW, barH);
      ctx.fillStyle = '#e5e7eb'; ctx.font = '12px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
      ctx.fillText(`Pile ${i+1}`, x + barW/2, rect.height - pad + 14);
      ctx.fillText(String(piles[i]), x + barW/2, y - 8);
    }

    // Remove overlay text to reduce confusion; UI buttons indicate state

    if(isGameOver()){
      // Winner is the last mover; fallback to current turn if not set
      const winner = lastMover || (yourTurn ? 'You' : 'AI');
      const label = winner === 'AI' 
      ? "AI wins... you just gave SkyNet its opening move" 
      : "You win! The AI is now sulking in binary.";
      const padding = 12; ctx.font = '600 16px ui-sans-serif, system-ui';
      const w = ctx.measureText(label).width;
      const x = (rect.width - w)/2 - padding; const y = rect.height/2 - 20; const bw = w+padding*2; const bh = 40;
      ctx.fillStyle = winner === 'You' ? '#16a34a' : '#ef4444';
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, rect.width/2, y + bh/2);
    }
  }

  function hitPile(px, py){
    const rect = canvas.getBoundingClientRect();
    const pad = 30; const gap = 20; const barW = Math.min(120, (rect.width - pad*2 - gap*(PILE_COUNT-1)) / PILE_COUNT);
    const barH = rect.height - pad*2;
    for(let i = 0; i < piles.length; i++){
      const x = pad + i * (barW + gap);
      const inX = px >= x && px <= x + barW;
      if(inX) return i;
    }
    return -1;
  }

  function onCanvasClick(evt){
    if(isGameOver()) return;
    if(!yourTurn) return;
    const rect = canvas.getBoundingClientRect();
    const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left;
    const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) - rect.top;
    const idx = hitPile(x, y);
    if(idx === -1) return;
    if(rearrangeMode){
      if(!rearrSelected.includes(idx)) rearrSelected.push(idx);
      if(rearrSelected.length > 2) rearrSelected = rearrSelected.slice(-2);
      // initialize split bounds to 0
      rearrSplit = 0;
      updateHUD();
      draw();
      return;
    }
    selectedPile = idx;
    updateHUD();
    draw();
  }

  function applyRemove(){
    if(!yourTurn || selectedPile === -1) return;
    const amt = Math.min(removeAmount, piles[selectedPile]);
    if(amt <= 0) return;
    piles[selectedPile] -= amt;
    if(piles[selectedPile] === 0) selectedPile = -1;
    lastMover = 'You';
    endTurn();
  }

  function endTurn(){
    updateHUD(); draw();
    if(isGameOver()) return;
    yourTurn = !yourTurn;
    updateHUD(); draw();
    if(!yourTurn) setTimeout(aiMove, 450);
  }

  function aiMove(){
    if(isGameOver()) return;
    // Stronger AI: prioritize winning moves; use rearrangement to create a within-limit winning move

    function computeNimSum(arr){ return arr.reduce((a, b) => a ^ b, 0); }

    function findImmediateWinningRemoval(arr){
      const s = computeNimSum(arr);
      if(s === 0) return null;
      for(let i = 0; i < arr.length; i++){
        const target = arr[i] ^ s;
        if(target < arr[i]){
          const need = arr[i] - target;
          if(need <= MAX_REMOVE_PER_TURN) return { pileIndex: i, remove: need };
        }
      }
      return null;
    }

    function tryRearrangeForImmediateWin(arr){
      if(aiRearrangesLeft <= 0) return null;
      const MAX_SHIFT = 6; // search window
      for(let a = 0; a < arr.length; a++){
        for(let b = a + 1; b < arr.length; b++){
          for(let k = -MAX_SHIFT; k <= MAX_SHIFT; k++){
            const na = arr[a] - k, nb = arr[b] + k;
            if(na < 0 || nb < 0 || na > PILE_CAPACITY || nb > PILE_CAPACITY) continue;
            const test = arr.slice(); test[a] = na; test[b] = nb;
            const win = findImmediateWinningRemoval(test);
            if(win){
              return { a, b, k, win };
            }
          }
        }
      }
      return null;
    }

    function tryRearrangeForProgress(arr){
      if(aiRearrangesLeft <= 0) return null;
      const MAX_SHIFT = 6;
      let best = null;
      let bestGap = Infinity;
      for(let a = 0; a < arr.length; a++){
        for(let b = a + 1; b < arr.length; b++){
          for(let k = -MAX_SHIFT; k <= MAX_SHIFT; k++){
            const na = arr[a] - k, nb = arr[b] + k;
            if(na < 0 || nb < 0 || na > PILE_CAPACITY || nb > PILE_CAPACITY) continue;
            const test = arr.slice(); test[a] = na; test[b] = nb;
            const s = computeNimSum(test);
            if(s === 0) continue;
            // Compute how far we are from an immediate winning removal after rearrangement
            for(let i = 0; i < test.length; i++){
              const target = test[i] ^ s;
              if(target < test[i]){
                const need = test[i] - target;
                const gap = Math.max(0, need - MAX_REMOVE_PER_TURN);
                if(gap < bestGap){
                  bestGap = gap;
                  best = { a, b, k, followIndex: i, need };
                  if(bestGap === 0) return best; // can't get better
                }
              }
            }
          }
        }
      }
      return best;
    }

    // 1) Immediate winning removal
    const immediate = findImmediateWinningRemoval(piles);
    if(immediate){
      piles[immediate.pileIndex] -= immediate.remove;
      selectedPile = -1;
      lastMover = 'AI';
      endTurn();
      return;
    }

    // 2) Rearrange to create an immediate winning removal within limit, then take it
    const combo = tryRearrangeForImmediateWin(piles);
    if(combo){
      const { a, b, k, win } = combo;
      const na = piles[a] - k, nb = piles[b] + k;
      piles[a] = na; piles[b] = nb; aiRearrangesLeft -= 1; updateHUD(); draw();
      piles[win.pileIndex] -= win.remove;
      selectedPile = -1;
      lastMover = 'AI';
      endTurn();
      return;
    }

    // 3) If losing (nimSum == 0) or immediate not possible, rearrange to maximize progress toward a winning move
    const progress = tryRearrangeForProgress(piles);
    if(progress){
      const { a, b, k, followIndex, need } = progress;
      const na = piles[a] - k, nb = piles[b] + k;
      piles[a] = na; piles[b] = nb; aiRearrangesLeft -= 1; updateHUD(); draw();
      const removeAmt = Math.min(MAX_REMOVE_PER_TURN, need);
      piles[followIndex] = Math.max(0, piles[followIndex] - removeAmt);
      selectedPile = -1;
      lastMover = 'AI';
      endTurn();
      return;
    }

    // 4) Fallback: remove aggressively from the largest pile
    let idx = 0; for(let i = 1; i < piles.length; i++) if(piles[i] > piles[idx]) idx = i;
    const amt = Math.min(MAX_REMOVE_PER_TURN, Math.max(1, Math.ceil(piles[idx] / 2)));
    piles[idx] = Math.max(0, piles[idx] - amt);
    selectedPile = -1;
    lastMover = 'AI';
    endTurn();
  }

  // Rearrangement controls (player)
  function startRearrange(){
    if(!yourTurn || userRearrangesLeft <= 0) return;
    rearrangeMode = true; rearrSelected = []; rearrSplit = 0; selectedPile = -1;
    updateHUD(); draw();
  }

  function commitRearrange(){
    if(!rearrangeMode || rearrSelected.length !== 2) return;
    const [a, b] = rearrSelected;
    // Try balanced heuristic: move up to 3 stones from larger to smaller under capacity
    const larger = piles[a] >= piles[b] ? a : b;
    const smaller = larger === a ? b : a;
    let moved = 0;
    for(let k = 3; k >= 1; k--){
      const na = piles[larger] - k; const nb = piles[smaller] + k;
      if(na >= 0 && nb <= PILE_CAPACITY){ moved = k; break; }
    }
    if(moved > 0){
      piles[larger] -= moved; piles[smaller] += moved; userRearrangesLeft -= 1;
    }
    rearrangeMode = false; rearrSelected = []; rearrSplit = 0;
    updateHUD(); draw();
  }

  function cancelRearrange(){ rearrangeMode = false; rearrSelected = []; rearrSplit = 0; updateHUD(); draw(); }

  // UI Handlers
  if(removeSlider) removeSlider.addEventListener('input', () => { removeAmount = parseInt(removeSlider.value); removeValEl && (removeValEl.textContent = removeSlider.value); });
  if(removeBtn) removeBtn.addEventListener('click', applyRemove);
  if(btnNew) btnNew.addEventListener('click', newGame);
  if(btnRearr) btnRearr.addEventListener('click', startRearrange);
  if(btnCommit) btnCommit.addEventListener('click', commitRearrange);
  if(btnCancel) btnCancel.addEventListener('click', cancelRearrange);

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchstart', (e) => { onCanvasClick(e); }, { passive: true });

  const ro = new ResizeObserver(() => { draw(); });
  ro.observe(canvas);

  newGame();
});


