// Mejora móvil: fecha, toggles de jornadas y comportamiento de la imagen de participantes.
// Fusiona con tu app.js existente si ya hay lógica de inyección de tablas/jornadas.

(function(){
  // Fecha de última actualización
  const last = document.getElementById('lastUpdated');
  if(last && !last.textContent.trim()){
    const d = new Date();
    last.textContent = `Última actualización: ${d.toLocaleString()}`;
  }

  // Inicializar toggles de jornadas (si las jornadas se inyectan como .matchday)
  const matchdaysRoot = document.getElementById('matchdays');
  if(matchdaysRoot){
    function initializeMatchdayToggles(){
      matchdaysRoot.querySelectorAll('.matchday').forEach(md=>{
        if(md.dataset.toggled) return;
        md.dataset.toggled = '1';
        const title = md.querySelector('.title');
        if(!title) return;

        let btn = md.querySelector('button.toggle');
        if(!btn){
          btn = document.createElement('button');
          btn.className = 'toggle';
          btn.type = 'button';
          btn.innerText = 'Ver';
          title.appendChild(btn);
        }

        btn.addEventListener('click', ()=>{
          const isOpen = md.classList.toggle('open');
          btn.innerText = isOpen ? 'Ocultar' : 'Ver';
          if(isOpen){
            const matches = md.querySelector('.matches');
            if(matches) matches.setAttribute('tabindex','-1');
            matches && matches.focus && matches.focus();
          }
        });
      });
    }

    const observer = new MutationObserver(()=> initializeMatchdayToggles());
    observer.observe(matchdaysRoot, {childList:true, subtree:true});
    initializeMatchdayToggles();
  }

  // Interacción: al tocar el banner de participantes lo ampliamos (simple modal-like)
  const banner = document.querySelector('.participants-banner img');
  if(banner){
    banner.style.cursor = 'zoom-in';
    banner.addEventListener('click', ()=>{
      // creador simple de modal
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = 0;
      overlay.style.background = 'rgba(2,6,23,0.7)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = 9999;
      overlay.addEventListener('click', ()=> document.body.removeChild(overlay));

      const img = document.createElement('img');
      img.src = banner.src;
      img.alt = banner.alt || 'Participantes';
      img.style.maxWidth = '96%';
      img.style.maxHeight = '92%';
      img.style.borderRadius = '10px';
      overlay.appendChild(img);

      document.body.appendChild(overlay);
    });
  }
})();
