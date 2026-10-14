/* Meta Pixel para as páginas do funil que não têm o snippet inline
   (loja, oferta e obrigado). Inicializa uma única vez por documento. */
(function () {
  var PIXEL = '2442971489550167';
  if (!window.fbq) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL);
  }
  /* Home e pagamento exibem um documento interno que já envia PageView.
     Nas demais rotas React, este documento é a única origem do evento. */
  var iframeOwnsPageView = window.top === window && (location.pathname === '/' || location.pathname === '/pagamento');
  if (!window.__lvPageViewSent && !iframeOwnsPageView) {
    window.__lvPageViewSent = true;
    try { fbq('track', 'PageView'); } catch (e) {}
    /* Fallback: se o script da Meta for bloqueado, o PageView ainda chega. */
    setTimeout(function () {
      try {
        if (window.fbq && window.fbq.loaded) return;
        var i = new Image();
        i.src = 'https://www.facebook.com/tr/?id=' + PIXEL + '&ev=PageView&noscript=1&rl=' + Date.now();
        window.__lvPvBeacon = i;
      } catch (e) {}
    }, 2500);
  }

  /* PageView nas mudanças de etapa do funil sem recarregar o documento. */
  var lastPath = location.pathname + location.search;
  setInterval(function () {
    var currentPath = location.pathname + location.search;
    if (currentPath === lastPath) return;
    lastPath = currentPath;
    try { fbq('track', 'PageView'); } catch (e) {}
  }, 600);

  /* Purchase deduplicado entre abas e sessões pelo ID canônico do pedido. */
  window.lvTrackPurchase = function (eventId, amount) {
    if (!eventId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
    var eid = 'pix_' + (eventId || '');
    try {
      if (localStorage.getItem('lv_purchase_' + eid)) return;
      localStorage.setItem('lv_purchase_' + eid, '1');
    } catch (e) {
      try {
        if (sessionStorage.getItem('lv_purchase_' + eid)) return;
        sessionStorage.setItem('lv_purchase_' + eid, '1');
      } catch (ignored) {}
    }
    try {
      fbq('track', 'Purchase', { value: Number(amount) || 0, currency: 'BRL' }, { eventID: eid });
    } catch (e) {}
    try {
      localStorage.setItem('lv_last_purchase', JSON.stringify({ eid: eventId, amount: Number(amount) || 0 }));
    } catch (e) {}
  };

  window.lvTrackInitiateCheckout = function (amount) {
    try { fbq('track', 'InitiateCheckout', { value: Number(amount) || 0, currency: 'BRL' }); } catch (e) {}
  };
})();
