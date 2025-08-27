document.addEventListener('DOMContentLoaded', () => {
  const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
  if(!tabs.length) return;

  function show(game){
    document.querySelectorAll('.game-view').forEach(el => {
      if(el.dataset.game === game) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });
    document.querySelectorAll('.game-controls').forEach(el => {
      if(el.dataset.game === game) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });
    tabs.forEach(t => {
      const isActive = t.dataset.tab === game;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));

  // Default to shortest path
  show('path');
});


