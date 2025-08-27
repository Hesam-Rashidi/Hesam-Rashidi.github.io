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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      const winner = yourTurn ? 'AI' : 'You'; // if it's your turn and no stones, AI took last
      const label = `${winner} win!`;
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
    // Basic nim strategy with occasional twist use to try for zero nim-sum
    const nimSum = piles.reduce((a, b) => a ^ b, 0);
    if(nimSum !== 0){
      // winning move exists: reduce a pile to make nim-sum 0
      for(let i = 0; i < piles.length; i++){
        const target = piles[i] ^ nimSum;
        if(target < piles[i]){
          const remove = Math.min(MAX_REMOVE_PER_TURN, piles[i] - target);
          piles[i] -= remove;
          selectedPile = -1;
          endTurn();
          return;
        }
      }
    }
    // If losing (nimSum == 0) and has rearrange, try to rearrange two piles to non-zero nim-sum under capacity
    if(nimSum === 0 && aiRearrangesLeft > 0){
      for(let a = 0; a < piles.length; a++){
        for(let b = a+1; b < piles.length; b++){
          // try moving k stones from a to b, keeping within capacity
          for(let k = -3; k <= 3; k++){
            const na = piles[a] - k, nb = piles[b] + k;
            if(na >= 0 && nb >= 0 && na <= PILE_CAPACITY && nb <= PILE_CAPACITY){
              const test = piles.slice(); test[a] = na; test[b] = nb;
              if((test.reduce((x,y)=>x^y,0)) !== 0){
                piles = test; aiRearrangesLeft -= 1; updateHUD(); draw();
                // remove 1 from best pile after rearrangement
                const idx = test.indexOf(Math.max(...test));
                piles[idx] = Math.max(0, piles[idx] - 1);
                endTurn();
                return;
              }
            }
          }
        }
      }
    }
    // fallback: remove min(1..MAX_REMOVE_PER_TURN) from largest pile
    let idx = 0; for(let i = 1; i < piles.length; i++) if(piles[i] > piles[idx]) idx = i;
    const amt = Math.min(MAX_REMOVE_PER_TURN, Math.max(1, Math.ceil(piles[idx] / 3)));
    piles[idx] = Math.max(0, piles[idx] - amt);
    selectedPile = -1;
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


