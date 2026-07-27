var header = document.getElementById('site-header');
  window.addEventListener('scroll', function(){
    if(window.scrollY > 40){ header.classList.add('scrolled'); }
    else{ header.classList.remove('scrolled'); }
  });

  var hamburger = document.getElementById('hamburger');
  var nav = document.getElementById('main-nav');
  hamburger.addEventListener('click', function(){
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ nav.classList.remove('open'); });
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
