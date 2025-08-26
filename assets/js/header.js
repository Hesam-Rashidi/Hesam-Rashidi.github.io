document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('progressBar');
  const header = document.querySelector('.header');

  function updateProgress() {
    if(bar) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }
  }

  function updateHeaderState() {
    if(!header) return;
    const scrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 8;
    if(scrolled) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }

  window.addEventListener('scroll', () => { updateProgress(); updateHeaderState(); }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
  updateHeaderState();
});


