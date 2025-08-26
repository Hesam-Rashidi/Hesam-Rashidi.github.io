document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.createElement('canvas');
  canvas.id = 'bgCanvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0, dpr = 1;
  let layers = [];
  const shooting = [];
  let lastSpawn = 0;
  let scrollY = window.scrollY || window.pageYOffset;

  const palette = {
    starDim: 'rgba(200,210,220,0.6)',
    starBright: 'rgba(230,240,255,0.9)',
    tail: 'rgba(120,160,220,0)'
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    width = vw; height = vh;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initLayers();
  }

  function initLayers() {
    // 3 parallax layers: far, mid, near
    const densities = [0.0008, 0.0012, 0.0016];
    const speeds = [0.15, 0.3, 0.6];
    layers = densities.map((density, i) => {
      const count = Math.floor(width * height * density);
      const stars = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * (height * 2), // extend vertically for scroll parallax
        r: 0.5 + Math.random() * (i === 2 ? 1.2 : 0.9),
        tw: Math.random() * Math.PI * 2,
        tSpeed: 0.4 + Math.random() * 0.6,
        bright: Math.random() > 0.85
      }));
      return { stars, speed: speeds[i] };
    });
  }

  function spawnShootingStar(t) {
    if(t - lastSpawn < 5000 + Math.random() * 6000) return;
    lastSpawn = t;
    const edge = Math.random() < 0.5 ? 'left' : 'top';
    let x, y, vx, vy;
    if(edge === 'left') { x = -60; y = Math.random() * (height * 0.7); vx = 7 + Math.random() * 5; vy = 2 + Math.random() * 2; }
    else { x = Math.random() * (width * 0.7); y = -60; vx = 2 + Math.random() * 2; vy = 7 + Math.random() * 5; }
    const len = 140 + Math.random() * 120;
    shooting.push({ x, y, vx, vy, life: 0, maxLife: 900, len });
  }

  function drawLayers(t) {
    const baseY = scrollY; // parallax based on scroll
    for(const layer of layers) {
      for(const s of layer.stars) {
        // vertical parallax shift with scroll
        const y = (s.y + baseY * layer.speed) % (height * 2);
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(s.tw + t * 0.001 * s.tSpeed));
        ctx.beginPath();
        ctx.fillStyle = s.bright ? palette.starBright : palette.starDim;
        ctx.globalAlpha = alpha;
        ctx.arc(s.x, y - height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawShooting(dt) {
    for(let i = shooting.length - 1; i >= 0; i--) {
      const s = shooting[i];
      s.life += dt; s.x += s.vx; s.y += s.vy;
      const progress = Math.min(1, s.life / s.maxLife);
      const tail = s.len * (1 - progress);
      const angle = Math.atan2(s.vy, s.vx);
      const tx = s.x - Math.cos(angle) * tail;
      const ty = s.y - Math.sin(angle) * tail;
      const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
      grad.addColorStop(0, palette.starBright);
      grad.addColorStop(1, palette.tail);
      ctx.strokeStyle = grad; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = palette.starBright;
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.6, 0, Math.PI*2); ctx.fill();
      if(s.x > width + 200 || s.y > height + 200 || s.life > s.maxLife) shooting.splice(i, 1);
    }
  }

  let lastTime = performance.now();
  function frame(now) {
    const dt = now - lastTime; lastTime = now;
    ctx.clearRect(0, 0, width, height);
    drawLayers(now);
    drawShooting(dt);
    spawnShootingStar(now);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => { scrollY = window.scrollY || window.pageYOffset; }, { passive: true });
  resize();
  requestAnimationFrame(frame);
});

 