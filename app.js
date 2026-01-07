// Fragmento opcional para mejorar la experiencia táctil en móviles.
// Si ya tienes app.js, fusiona o añade estas funciones sin sustituir tu lógica existente.

(function(){
  // Actualiza la fecha de última actualización (si no lo hace ya tu app)
  const last = document.getElementById('lastUpdated');
  if(last && !last.textContent.trim()){
    const d = new Date();
    last.textContent = `Última actualización: ${d.toLocaleString()}`;
  }

  // Delegación: detectar items de jornada una vez insertados por tu código
  const matchdaysRoot = document.getElementById('matchdays');
  if(!matchdaysRoot) return;

  // Si las jornadas se inyectan como elementos .matchday, añadimos manejador.
  function initializeMatchdayToggles(){
    matchdaysRoot.querySelectorAll('.matchday').forEach(md=>{
      // Evitamos doble inicialización
      if(md.dataset.toggled) return;
      md.dataset.toggled = '1';
      const title = md.querySelector('.title');
      if(!title) return;

      // Crear botón táctil (si no existe)
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
        // Para accesibilidad, movemos foco al contenedor de partidos cuando se abre
        if(isOpen){
          const matches = md.querySelector('.matches');
          if(matches) matches.setAttribute('tabindex','-1');
          matches && matches.focus && matches.focus();
        }
      });
    });
  }

  // Observador para inicializar toggles cuando tu app inyecte contenido dinámico
  const observer = new MutationObserver((mutations)=>{
    initializeMatchdayToggles();
  });
  observer.observe(matchdaysRoot, {childList:true, subtree:true});

  // Inicializar por si ya hay contenido
  initializeMatchdayToggles();
})();
