var header = document.getElementById('site-header');
  window.addEventListener('scroll', function(){
    if(window.scrollY > 40){ header.classList.add('scrolled'); }
    else{ header.classList.remove('scrolled'); }
  });

  var hamburger = document.getElementById('hamburger');
  var nav = document.getElementById('main-nav');
  var backdrop = document.getElementById('nav-backdrop');

  function openNav(){
    nav.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Cerrar menú');
    backdrop.classList.add('visible');
    document.body.classList.add('nav-locked');
  }
  function closeNav(){
    nav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Abrir menú');
    backdrop.classList.remove('visible');
    document.body.classList.remove('nav-locked');
  }
  hamburger.addEventListener('click', function(){
    if (nav.classList.contains('open')) closeNav(); else openNav();
  });
  backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeNav();
  });
  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeNav);
  });

  var revealEls = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  revealEls.forEach(function(el){ io.observe(el); });
