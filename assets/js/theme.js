// Dark mode only - no theme switching needed
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }
});