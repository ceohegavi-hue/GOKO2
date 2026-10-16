/**
 * product-loader.js — Template de ofertas (TEMPLATE-OFERTAS)
 *
 * Lê o arquivo `product.json` (fonte de verdade do produto) e injeta os dados
 * em todas as páginas do funil automaticamente:
 *   - Meta tags (title, description, og:*, twitter:*)
 *   - Elementos com atributo `data-product="chave"` (texto ou src de imagem)
 *   - Avaliações (expõe window.PRODUCT.avaliacoes e dispara evento)
 *   - Preços (expõe window.PRODUCT.preco etc.)
 *
 * Para trocar de produto, edite apenas o `product.json` (ou use o admin.html).
 */
(function () {
  var CONFIG_URL = 'product.json';

  function getPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function setMeta(attr, content) {
    if (content == null) return;
    var el = document.querySelector('meta[' + attr + ']');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, content);
      document.head.appendChild(el);
    } else {
      el.setAttribute('content', content);
    }
  }

  function setMetaName(name, content) {
    if (content == null) return;
    var el = document.querySelector('meta[name="' + name + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', content);
      document.head.appendChild(el);
    } else {
      el.setAttribute('content', content);
    }
  }

  function applyMeta(meta) {
    if (!meta) return;
    if (meta.title) document.title = meta.title;
    setMetaName('description', meta.description);
    setMeta('property="og:title"', meta.title);
    setMeta('property="og:description"', meta.description);
    setMeta('property="og:image"', meta.image);
    setMeta('name="twitter:title"', meta.title);
    setMeta('name="twitter:description"', meta.description);
    setMeta('name="twitter:image"', meta.image);
  }

  function applyDataAttributes(cfg) {
    var els = document.querySelectorAll('[data-product]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-product');
      var val = getPath(cfg, key);
      if (val == null || val === '') continue;
      if (el.tagName === 'IMG') {
        el.setAttribute('src', val);
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = val;
      } else {
        el.textContent = val;
      }
    }
  }

  function apply(cfg) {
    // Expõe o produto globalmente para qualquer script da página.
    window.PRODUCT = cfg;

    applyMeta(cfg.meta);
    applyDataAttributes(cfg);

    // Notifica páginas que escutam avaliações/preços dinâmicos.
    document.dispatchEvent(new CustomEvent('product:loaded', { detail: cfg }));
    if (cfg.avaliacoes && cfg.avaliacoes.length) {
      document.dispatchEvent(new CustomEvent('product:reviews', { detail: cfg.avaliacoes }));
    }
  }

  function load() {
    // 1) Tenta o produto salvo no Blob (via painel admin).
    // 2) Se não existir, usa o product.json estático do repositório.
    fetch('/api/admin/product', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('blob');
        return r.json();
      })
      .then(apply)
      .catch(function () {
        fetch(CONFIG_URL, { cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) throw new Error('product.json não encontrado (' + r.status + ')');
            return r.json();
          })
          .then(apply)
          .catch(function (err) {
            if (window.console && console.warn) {
              console.warn('[product-loader]', err.message);
            }
          });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
