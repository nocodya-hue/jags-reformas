// JAGS Reformas · interacciones
// · Obras: al bajar, la cinta métrica se estira y la foto pasa por las fases de la obra (antes → durante → terminado).
// · Contadores, apariciones, galería ampliable, cabecera, menú, barra móvil y formulario que abre WhatsApp.
window.__jags = 1;
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- obras: cinta métrica + fases ----------
const obras = $$('[data-obra]').map((o) => ({ o, hoja: $('.cinta__hoja', o), fotos: $$('.obra__foto', o), fases: $$('.obra__fases li', o), fase: -1 }));
const pintaObras = () => {
  for (const x of obras) {
    const r = x.o.getBoundingClientRect(), recorrido = x.o.offsetHeight - innerHeight;
    if (r.bottom < -200 || r.top > innerHeight + 200) continue;
    const t = quieto || recorrido <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / recorrido));
    x.hoja.style.setProperty('--avance', `${(t * 100).toFixed(1)}%`);
    const f = t < .34 ? 0 : t < .67 ? 1 : 2;
    if (f !== x.fase) {
      x.fase = f;
      x.fotos.forEach((el, i) => el.classList.toggle('activa', i === f));
      x.fases.forEach((el, i) => el.classList.toggle('activa', i === f));
    }
  }
};
let pendiente = false;
const pide = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(() => { pendiente = false; pintaObras(); alBajar(); }); } };

// ---------- cabecera y barra móvil ----------
const cab = $('[data-cab]'), barra = $('[data-barra]'), hero = $('.hero');
function alBajar() {
  const limite = hero ? hero.offsetHeight - 80 : 10;
  cab?.classList.toggle('cab--solida', scrollY > limite);
  barra?.classList.toggle('ver', scrollY > (hero ? hero.offsetHeight * .7 : 300));
}
addEventListener('scroll', pide, { passive: true });
addEventListener('resize', pide);
pide();

// ---------- apariciones y contadores ----------
const cuenta = (el) => {
  const fin = +el.dataset.cuenta, t0 = performance.now(), dur = 1200;
  const paso = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
};
const vistos = $$('[data-revela], .zona, .cifras');
if ('IntersectionObserver' in window && !quieto) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visto');
    $$('[data-cuenta]', e.target).forEach(cuenta);
    io.unobserve(e.target);
  }), { threshold: .25 });
  vistos.forEach((v) => io.observe(v));
} else vistos.forEach((v) => v.classList.add('visto'));

// ---------- galería ampliable ----------
const visor = $('[data-visor]');
if (visor) {
  const im = $('[data-visor-img]', visor);
  const abre = (i) => { im.src = window.__GALERIA[i]; visor.hidden = false; document.body.style.overflow = 'hidden'; };
  const cierra = () => { visor.hidden = true; im.removeAttribute('src'); document.body.style.overflow = ''; };
  $$('[data-foto]').forEach((b) => b.addEventListener('click', () => abre(+b.dataset.foto)));
  visor.addEventListener('click', (e) => { if (e.target !== im) cierra(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !visor.hidden) cierra(); });
}

// ---------- menú ----------
const boton = $('[data-menu]'), panel = $('[data-menu-panel]');
if (boton && panel) {
  const abre = (si) => {
    boton.setAttribute('aria-expanded', si); boton.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
    panel.hidden = !si; document.body.classList.toggle('menu-abierto', si);
  };
  boton.addEventListener('click', () => abre(boton.getAttribute('aria-expanded') !== 'true'));
  $$('a', panel).forEach((a) => a.addEventListener('click', () => abre(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') abre(false); });
}

// ---------- formulario → WhatsApp ----------
const form = $('[data-form]');
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form)), error = $('[data-form-error]', form);
  const faltan = ['nombre', 'mensaje'].filter((k) => !String(d[k] || '').trim());
  $$('input, textarea', form).forEach((c) => c.classList.toggle('mal', faltan.includes(c.name)));
  error.hidden = !faltan.length;
  if (faltan.length) { form.elements[faltan[0]].focus(); return; }
  const txt = `¡Hola! Soy ${d.nombre.trim()}. Os escribo desde la web de JAGS Reformas.\n\n• Trabajo: ${d.servicio}${d.donde.trim() ? `\n• Dónde: ${d.donde.trim()}` : ''}\n• ${d.mensaje.trim()}`;
  window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
});
