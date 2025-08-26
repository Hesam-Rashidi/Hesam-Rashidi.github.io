document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // --- Layout constants: 2 columns, 7 rows max ---
  const GRID_X = 20;            // left padding
  const GRID_Y = 18;            // top padding
  const ITEM_COLS = 2;
  const ITEM_ROWS_MAX = 7;
  const ITEM_W = 116;
  const ITEM_H = 42;            // compact height to fit 7 rows in 380px
  const SPACING_X = 20;
  const SPACING_Y = 10;
  const LEFT_GRID_WIDTH = GRID_X + ITEM_COLS * ITEM_W + (ITEM_COLS - 1) * SPACING_X;
  const RIGHT_GAP = 50;         // gap between grid and knapsack
  
  let items = [];
  let selectedItems = new Set();
  let knapsackCapacity = 100;
  let aiValue = null;
  let aiSelectedItems = new Set();
  let userValue = null;
  let userWeight = 0;
  let hoveredItem = null;
  let showAISolution = false;

  const capacitySlider = document.getElementById('capacity');
  const capacityVal = document.getElementById('capacityVal');
  const aiValueEl = document.getElementById('aiValue');
  const userValueEl = document.getElementById('userValue');
  const weightDisplay = document.getElementById('weightDisplay');

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function positionForIndex(index){
    const col = index % ITEM_COLS;
    const row = Math.floor(index / ITEM_COLS);
    return {
      x: GRID_X + col * (ITEM_W + SPACING_X),
      y: GRID_Y + row * (ITEM_H + SPACING_Y)
    };
  }

  function generateItems() {
    items = [];
    const itemNames = ['Laptop', 'Book', 'Camera', 'Tablet', 'Phone', 'Charger', 'Snacks', 'Water', 'Jacket', 'Shoes', 'Wallet', 'Keys', 'Glasses', 'Watch']; // 14 items (2x7)
    
    const maxItems = Math.min(itemNames.length, ITEM_COLS * ITEM_ROWS_MAX);
    for(let i = 0; i < maxItems; i++) {
      const pos = positionForIndex(i);
      items.push({
        id: i,
        name: itemNames[i],
        weight: rand(5, 25),
        value: rand(10, 50),
        x: pos.x,
        y: pos.y,
        selected: false
      });
    }
    selectedItems.clear();
    updateUserStats();
    draw();
  }

  function knapsackDP() {
    const n = items.length;
    const W = knapsackCapacity;
    const dp = Array(n + 1).fill(null).map(() => Array(W + 1).fill(0));
    
    for(let i = 1; i <= n; i++) {
      for(let w = 1; w <= W; w++) {
        if(items[i-1].weight <= w) {
          dp[i][w] = Math.max(
            dp[i-1][w],
            dp[i-1][w - items[i-1].weight] + items[i-1].value
          );
        } else {
          dp[i][w] = dp[i-1][w];
        }
      }
    }
    
    return dp[n][W];
  }

  function greedyByRatio() {
    const sortedItems = [...items].sort((a, b) => (b.value / b.weight) - (a.value / a.weight));
    let totalWeight = 0;
    let totalValue = 0;
    const selectedIds = new Set();
    
    for(const item of sortedItems) {
      if(totalWeight + item.weight <= knapsackCapacity) {
        totalWeight += item.weight;
        totalValue += item.value;
        selectedIds.add(item.id);
      }
    }
    
    aiSelectedItems = selectedIds; // Store AI selection
    return totalValue;
  }

  function aiSolve() {
    aiValue = greedyByRatio();
    aiValueEl.textContent = aiValue;
    showAISolution = true;
    draw();
  }

  function updateUserStats() {
    userWeight = 0;
    userValue = 0;
    
    for(const itemId of selectedItems) {
      const item = items[itemId];
      userWeight += item.weight;
      userValue += item.value;
    }
    
    userValueEl.textContent = userValue;
    weightDisplay.textContent = `${userWeight}/${knapsackCapacity}`;
    weightDisplay.style.color = userWeight > knapsackCapacity ? '#ef4444' : '#10b981';
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Get actual CSS dimensions for layout calculations
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    const isMobile = cssW < 600; // Mobile detection
    
    const knapsackWidth = isMobile ? 100 : 120;
    const knapsackHeight = isMobile ? 300 : 200;
    const knapsackX = isMobile ? (cssW - knapsackWidth - 20) : (LEFT_GRID_WIDTH + RIGHT_GAP);
    const knapsackY = isMobile ? 
      Math.min(GRID_Y + 200, cssH - knapsackHeight - 20) : // Below items but ensure it fits
      Math.max(GRID_Y, Math.min(GRID_Y + 10, (cssH - knapsackHeight - 30) / 2));
    
    ctx.save();
    // Outer knapsack frame
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    ctx.strokeRect(knapsackX, knapsackY, knapsackWidth, knapsackHeight);
    
    // Knapsack label
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 14px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Knapsack', knapsackX + knapsackWidth/2, knapsackY - 10);
    
    // Enhanced capacity visualization
    const capacityColor = userWeight > knapsackCapacity ? '#ef4444' : '#10b981';
    const innerPad = 10;
    const innerW = knapsackWidth - innerPad * 2;
    const innerH = knapsackHeight - innerPad * 2;
    const fillHeight = Math.max(0, Math.min(innerH, (userWeight / knapsackCapacity) * innerH));
    const fillY = knapsackY + innerPad + (innerH - fillHeight);

    // Background for capacity bar
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(knapsackX + innerPad, knapsackY + innerPad, innerW, innerH);

    // Capacity fill (clamped)
    ctx.fillStyle = capacityColor + '80';
    ctx.fillRect(knapsackX + innerPad, fillY, innerW, fillHeight);

    // Capacity border
    ctx.strokeStyle = capacityColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(knapsackX + innerPad, knapsackY + innerPad, innerW, innerH);

    // Capacity text below
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px ui-sans-serif, system-ui';
    ctx.fillText(`${userWeight}/${knapsackCapacity}`, knapsackX + knapsackWidth/2, knapsackY + knapsackHeight + 18);
    ctx.restore();
    
    // Draw items (left grid: 2 columns x up to 7 rows)
    items.forEach(item => {
      const isSelected = selectedItems.has(item.id);
      const isHovered = hoveredItem === item.id;
      const isAISelected = showAISolution && aiSelectedItems.has(item.id);
      
      // Visual feedback (shadow) - more subtle
      if(isSelected || isHovered) {
        ctx.shadowColor = isSelected ? '#9ca3af' : '#6b7280';
        ctx.shadowBlur = isSelected ? 6 : 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Background - more subtle highlights
      if(isSelected) {
        ctx.fillStyle = '#4b5563'; // Subtle gray-blue for user selection
      } else if(isAISelected) {
        ctx.fillStyle = '#065f46'; // Dark green for AI selection
      } else if(isHovered) {
        ctx.fillStyle = '#434343'; // Very subtle hover
      } else {
        ctx.fillStyle = '#374151';
      }
      ctx.fillRect(item.x, item.y, ITEM_W, ITEM_H);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Border - more subtle selection
      if(isSelected) {
        ctx.strokeStyle = '#9ca3af'; // Gray for user selection
        ctx.lineWidth = 2;
      } else if(isAISelected) {
        ctx.strokeStyle = '#10b981'; // Green border for AI selection
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(item.x, item.y, ITEM_W, ITEM_H);
      
      // Text
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 11px ui-sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, item.x + ITEM_W/2, item.y + 16);
      
      ctx.font = '10px ui-sans-serif, system-ui';
      ctx.fillText(`W: ${item.weight}`, item.x + ITEM_W/2, item.y + 28);
      ctx.fillText(`V: ${item.value}`, item.x + ITEM_W/2, item.y + 38);
      
      // Ratio color-coded
      const ratio = (item.value / item.weight).toFixed(1);
      const ratioValue = parseFloat(ratio);
      ctx.font = '9px ui-sans-serif, system-ui';
      if(ratioValue >= 2.0) ctx.fillStyle = '#10b981';
      else if(ratioValue >= 1.5) ctx.fillStyle = '#f59e0b';
      else ctx.fillStyle = '#ef4444';
      ctx.fillText(`R: ${ratio}`, item.x + ITEM_W - 18, item.y + ITEM_H - 6);
    });

    // Completion banner - only show when AI solution is requested and user has a valid solution
    const isValidSolution = userWeight <= knapsackCapacity && selectedItems.size > 0;
    if(isValidSolution && aiValue !== null && showAISolution) {
      const efficiency = ((userValue / aiValue) * 100).toFixed(1);
      const isOptimal = userValue >= aiValue * 0.95;
      const isExcellent = userValue > aiValue;
      
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = isExcellent ? '#059669' : (isOptimal ? '#16a34a' : '#374151');
      const label = isExcellent ? `🎉 Outstanding! You beat the AI! (${efficiency}%)` : (isOptimal ? `🌟 Excellent! ${efficiency}% efficiency` : `👍 Good work! ${efficiency}% efficiency`);
      const padding = 14;
      ctx.font = '600 14px ui-sans-serif, system-ui';
      const textWidth = ctx.measureText(label).width;
      const boxX = (cssW - textWidth) / 2 - padding;
      const boxY = cssH - 44;
      const boxW = textWidth + padding * 2;
      const boxH = 32;
      ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, cssW / 2, boxY + boxH / 2);
      ctx.restore();
    }
  }

  function getItemAt(x, y) {
    for(const item of items) {
      if(x >= item.x && x <= item.x + ITEM_W && y >= item.y && y <= item.y + ITEM_H) {
        return item;
      }
    }
    return null;
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Convert to CSS coordinates (no DPR scaling needed for hit detection)
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const item = getItemAt(mx, my);
    const newHoveredItem = item ? item.id : null;
    
    if(newHoveredItem !== hoveredItem) {
      hoveredItem = newHoveredItem;
      canvas.style.cursor = hoveredItem !== null ? 'pointer' : 'default';
      draw();
    }
  });

  function handleItemClick(e) {
    e.preventDefault(); // Prevent default touch behavior
    const rect = canvas.getBoundingClientRect();
    // Convert to CSS coordinates (no DPR scaling needed for hit detection)
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const item = getItemAt(mx, my);
    if(item) {
      if(selectedItems.has(item.id)) selectedItems.delete(item.id);
      else selectedItems.add(item.id);
      updateUserStats();
      draw();
    }
  }

  canvas.addEventListener('click', handleItemClick);
  
  // Add touch support for mobile devices
  canvas.addEventListener('touchstart', (e) => {
    if(e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      
      const item = getItemAt(mx, my);
      if(item) {
        e.preventDefault(); // Prevent scrolling when touching items
        if(selectedItems.has(item.id)) selectedItems.delete(item.id);
        else selectedItems.add(item.id);
        updateUserStats();
        draw();
      }
    }
  });

  // Controls
  document.getElementById('newBtn').addEventListener('click', () => {
    generateItems();
    aiValueEl.textContent = '–';
    aiValue = null;
    aiSelectedItems.clear();
    showAISolution = false;
  });

  document.getElementById('solveBtn').addEventListener('click', aiSolve);
  
  document.getElementById('clearBtn').addEventListener('click', () => {
    selectedItems.clear();
    showAISolution = false; // Hide AI solution when clearing
    aiSelectedItems.clear();
    updateUserStats();
    draw();
  });

  capacitySlider.addEventListener('input', () => {
    capacityVal.textContent = capacitySlider.value;
    knapsackCapacity = parseInt(capacitySlider.value);
    updateUserStats();
    draw();
  });

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.floor(rect.width);
    const cssHeight = Math.floor(rect.height);
    
    // Set canvas internal dimensions with device pixel ratio
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    
    // Scale the drawing context to match the device pixel ratio
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Ensure canvas displays at the correct CSS size
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    
    draw();
  }

  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(canvas);
  
  // Handle orientation changes with a slight delay for proper recalculation
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
  });

  // Initialize
  knapsackCapacity = parseInt(capacitySlider.value);
  generateItems();
  resizeCanvas();

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if(e.key === 'c' || e.key === 'C') document.getElementById('clearBtn').click();
    if(e.key === 'n' || e.key === 'N') document.getElementById('newBtn').click();
    if(e.key === 's' || e.key === 'S') document.getElementById('solveBtn').click();
  });
});
