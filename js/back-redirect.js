(function () {
  if (window.__lvBackRedirectInstalled) return;
  window.__lvBackRedirectInstalled = true;

  var IN_FRAME = window.self !== window.top;

  function normalize(p) {
    p = (p || '').split('?')[0].split('#')[0];
    p = p.replace(/\.html$/i, '').replace(/\/$/, '');
    if (p === '') p = '/';
    return p;
  }

  var TARGETS = {
    '/index': '/oferta',
    '/loja': '/',
    // '/pagamento' volta para a home com popup (tratado em onBack).
    '/oferta': '/',
    '/upsell1': '/pagamento',
    '/upsell2': '/upsell1',
    '/upsell3': '/upsell2',
    '/upsell4': '/upsell3',
    '/obrigado': '/upsell4'
  };

  // Páginas da home: o voltar abre popup de desconto em vez de redirecionar.
  var HOME_PATHS = { '/': true, '/site': true };

  function targetFor(path) {
    return TARGETS[normalize(path)] || null;
  }

  function redirect(to) {
    // Dentro do quadro da página inicial, a navegação acontece na janela inteira,
    // do mesmo jeito que o resto do site faz (e guarda os parâmetros da campanha).
    try {
      if (window.top && window.top !== window && window.top.location.origin === window.location.origin) {
        var t = window.top.location;
        var tu = new URL(to, t.href);
        tu.search = t.search;
        tu.hash = t.hash;
        t.assign(tu.toString());
        return;
      }
    } catch (e) {}
    var url;
    try {
      url = new URL(to, location.href);
      url.search = location.search;
      url.hash = location.hash;
    } catch (e) {
      url = to + location.search + location.hash;
    }
    try { window.location.assign(url.toString()); } catch (e2) { window.location.href = url.toString(); }
  }

  // ---------- Popup de desconto (somente na home) ----------
  var popupShown = false;

  function closePopup() {
    var ov = document.getElementById('lv-back-promo');
    if (ov) ov.remove();
    document.documentElement.style.overflow = '';
  }

  function showPromoPopup() {
    if (popupShown) return;
    popupShown = true;

    var css = document.createElement('style');
    css.textContent =
      '#lv-back-promo{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.62);backdrop-filter:blur(2px);animation:lvbpFade .22s ease-out;font-family:Inter,system-ui,-apple-system,sans-serif}' +
      '@keyframes lvbpFade{from{opacity:0}to{opacity:1}}' +
      '@keyframes lvbpUp{from{transform:translateY(46px);opacity:0}to{transform:none;opacity:1}}' +
      '#lv-back-promo .card{width:100%;max-width:440px;background:#fff;border-radius:22px 22px 0 0;padding:22px 18px calc(20px + env(safe-area-inset-bottom));text-align:center;animation:lvbpUp .3s cubic-bezier(.2,.8,.2,1);position:relative}' +
      '#lv-back-promo .x{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:0;background:#f1f2f4;color:#555;font-size:16px;cursor:pointer;line-height:1}' +
      '#lv-back-promo .tag{display:inline-block;background:#fe2c55;color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;padding:6px 12px;border-radius:999px;margin-bottom:10px}' +
      '#lv-back-promo h2{margin:0 0 4px;font-size:20px;font-weight:800;color:#161823}' +
      '#lv-back-promo p.sub{margin:0 0 14px;font-size:13px;color:#6b7280}' +
      '#lv-back-promo img.prod{width:150px;height:150px;object-fit:contain;margin:0 auto 8px;display:block}' +
      '#lv-back-promo .old{font-size:14px;color:#9aa1ad;text-decoration:line-through}' +
      '#lv-back-promo .new{font-size:34px;font-weight:800;color:#fe2c55;letter-spacing:-.5px;margin:2px 0 2px}' +
      '#lv-back-promo .off{font-size:12px;font-weight:700;color:#0ea5a4;margin-bottom:14px}' +
      '#lv-back-promo .cta{display:block;width:100%;border:0;border-radius:999px;background:#fe2c55;color:#fff;font-size:16px;font-weight:800;padding:15px;cursor:pointer;box-shadow:0 10px 22px rgba(254,44,85,.32);font-family:inherit}' +
      '#lv-back-promo .cta:active{transform:scale(.98)}' +
      '#lv-back-promo .no{display:inline-block;margin-top:12px;background:none;border:0;font-size:12.5px;color:#9aa1ad;text-decoration:underline;cursor:pointer;font-family:inherit}';
    document.head.appendChild(css);

    var ov = document.createElement('div');
    ov.id = 'lv-back-promo';
    ov.innerHTML =
      '<div class="card" role="dialog" aria-modal="true" aria-label="Oferta de desconto">' +
      '<button class="x" type="button" aria-label="Fechar">✕</button>' +
      '<span class="tag">OFERTA RELÂMPAGO</span>' +
      '<h2>Espera! Não vá embora...</h2>' +
      '<p class="sub">Liberamos um combo exclusivo só agora: 3 Escovas Modeladoras GOKOCO na cor Preta!</p>' +
      '<img class="prod" src="/images/f2/cores/preta.webp" alt="3 Escovas Modeladoras GOKOCO Preta">' +
      '<div class="old">De R$ 90,00</div>' +
      '<div class="new">3 por R$ 50,00</div>' +
      '<div class="off">44% OFF · sai por R$ 16,67 cada · só nesta página</div>' +
      '<button class="cta" type="button">QUERO AS 3 POR R$ 50,00</button>' +
      '<button class="no" type="button">Não, obrigado. Prefiro pagar o valor cheio.</button>' +
      '</div>';
    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';

    ov.addEventListener('click', function (e) {
      if (e.target === ov) closePopup();
    });
    ov.querySelector('.x').addEventListener('click', closePopup);
    ov.querySelector('.no').addEventListener('click', function () {
      closePopup();
      redirect('/oferta');
    });
    ov.querySelector('.cta').addEventListener('click', function () {
      try {
        localStorage.setItem('precoUnit', String(50 / 3));
        localStorage.setItem('corSelecionada', 'Escova Modeladora GOKOCO (Preta) x3');
        localStorage.setItem('corImagem', '/images/f2/cores/preta.webp');
        localStorage.setItem('qtdSelecionada', '3');
        localStorage.setItem('coresSelecionadas', JSON.stringify([
          { name: 'Escova Modeladora GOKOCO (Preta)', label: 'Preta', quantity: 3, price: 50 / 3, img: '/images/f2/cores/preta.webp' }
        ]));
        localStorage.removeItem('voltagemSelecionada');
      } catch (e) {}
      try { if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', { value: 50, currency: 'BRL' }); } catch (e) {}
      redirect('/pagamento');
    });
  }

  window.lvShowBackPromo = function(){ popupShown = false; showPromoPopup(); };

  // Marca que o lead abriu o checkout. Se ele voltar para a home sem pagar
  // (botão voltar do celular, gesto de voltar, aba anterior restaurada etc.),
  // a home mostra o popup. Ao seguir para os upsells a marca é apagada.
  var CK = 'lvCheckoutOpen';
  var curPath = normalize(location.pathname);
  try {
    if (curPath === '/pagamento') sessionStorage.setItem(CK, '1');
    if (/^\/(upsell\d|obrigado)$/.test(curPath)) {
      sessionStorage.removeItem(CK);
      sessionStorage.removeItem('lvBackPromo');
    }
  } catch (e) {}

  function isBackNav() {
    try {
      var w = IN_FRAME ? window.top : window;
      var nav = w.performance.getEntriesByType('navigation')[0];
      return !!nav && nav.type === 'back_forward';
    } catch (e) { return false; }
  }

  // Chegou na home vindo do carrinho/checkout: abre o popup (também dentro do iframe da home).
  function checkPromo(persisted) {
    try {
      var hp = normalize(location.pathname);
      var homeTopWithFrame = !IN_FRAME && hp === '/' && document.querySelector('iframe[src*="site"]');
      var fromCheckout = sessionStorage.getItem(CK) === '1';
      if (HOME_PATHS[hp] && !homeTopWithFrame &&
          (sessionStorage.getItem('lvBackPromo') === '1' || fromCheckout)) {
        sessionStorage.removeItem('lvBackPromo');
        sessionStorage.removeItem(CK);
        if (persisted) popupShown = false;
        setTimeout(showPromoPopup, 600);
        return;
      }
      // Voltou do checkout para a loja: leva para a home com a oferta.
      if (hp === '/loja' && fromCheckout && (persisted || isBackNav())) {
        sessionStorage.removeItem(CK);
        sessionStorage.setItem('lvBackPromo', '1');
        var target = IN_FRAME ? window.top : window;
        try {
          var u = new URL('/', target.location.href);
          u.search = target.location.search;
          target.location.href = u.toString();
        } catch (e2) { target.location.href = '/'; }
      }
    } catch (e) {}
  }
  checkPromo(false);
  // Página restaurada do cache do navegador ao apertar "voltar" (comum no celular).
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) { closePopup(); checkPromo(true); }
  });

  if (IN_FRAME) return;

  var redirected = false;

  function onBack() {
    if (redirected) return;
    var path = normalize(location.pathname);
    if (path === '/loja' || path === '/pagamento') {
      // Volta da loja ou do checkout para a home e abre o popup de oferta lá.
      redirected = true;
      try { sessionStorage.setItem('lvBackPromo', '1'); } catch (e) {}
      redirect('/');
      return;
    }
    if (HOME_PATHS[path]) {
      // Popup pode ser reaberto em um próximo "voltar" caso a pessoa feche.
      showPromoPopup();
      try { history.pushState({ __lvBackGuard: true }, '', location.href); } catch (e) {}
      return;
    }
    var to = targetFor(path);
    if (to && to !== path) {
      redirected = true;
      redirect(to);
    }
  }

  window.addEventListener('popstate', function () {
    // Pequeno delay para evitar conflito com routers que cancelam a navegação.
    setTimeout(onBack, 0);
  });

  // Insere uma entrada fantasma no histórico para que, mesmo que a página seja
  // a primeira do tab, o primeiro "voltar" dispare popstate dentro do site.
  try {
    history.pushState({ __lvBackGuard: true }, '', location.href);
  } catch (e) {}

})();
