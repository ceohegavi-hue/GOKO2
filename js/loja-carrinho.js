/* Shared item selection for the store and checkout, including mixed baskets. */
(function () {
  var items = [];
  try { items = JSON.parse(localStorage.getItem('coresSelecionadas') || '[]'); } catch (e) {}
  if (!Array.isArray(items) || !items.length) return;
  items = items.filter(function (p) { return p.name && p.img && Number(p.price) > 0 && Number(p.quantity) > 0; });
  if (!items.length) return;
  function fmt(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }
  window.lvCartItems = function () { return items; };
  window.lvCartSubtotal = function () { return items.reduce(function (sum, p) { return sum + p.price * p.quantity; }, 0); };
  function persist() {
    var qty = items.reduce(function (s, p) { return s + p.quantity; }, 0);
    var name = items.map(function (p) { return p.name + (p.quantity > 1 ? ' x' + p.quantity : ''); }).join(' + ');
    localStorage.setItem('coresSelecionadas', JSON.stringify(items));
    localStorage.setItem('qtdSelecionada', String(qty));
    localStorage.setItem('precoUnit', String(window.lvCartSubtotal() / qty));
    localStorage.setItem('corSelecionada', name);
    localStorage.setItem('produtoComprado', JSON.stringify({nome: name, img: items[0].img, qtd: qty, itens: items, voltagem: localStorage.getItem('voltagemSelecionada') || ''}));
    document.querySelectorAll('.border-neutral-200 > span').forEach(function (el) { if (/^\d+$/.test(el.textContent.trim())) el.textContent = String(qty); });
    document.querySelectorAll('#lv-step-1 h3, #lv-step-2 h3, #lv-step-3 h3').forEach(function (el) {
      if (el.textContent.trim() === 'Seu carrinho' && el.nextElementSibling) el.nextElementSibling.textContent = String(qty);
    });
  }
  function render() {
    persist();
    document.querySelectorAll('#lv-step-1, #lv-step-2, #lv-step-3').forEach(function (step) {
      if (step.querySelector('[data-lv-cart-items]')) return;
      var img = step.querySelector('img[alt="Produto"], img[alt^="Escova Modeladora"]');
      if (!img) return;
      var original = img.parentElement;
      if (!original) return;
      var list = document.createElement('div');
      list.dataset.lvCartItems = '1';
      list.className = 'space-y-3 mt-3';
      items.forEach(function (p) {
        var row = document.createElement('div');
        row.className = 'flex items-center gap-3';
        var photo = document.createElement('img');
        photo.src = p.img; photo.alt = p.name;
        photo.className = 'w-12 h-12 object-contain shrink-0';
        var info = document.createElement('div'); info.className = 'flex-1 min-w-0';
        var title = document.createElement('p'); title.className = 'text-[13px] font-semibold text-neutral-900 leading-tight'; title.textContent = p.name;
        var price = document.createElement('p'); price.className = 'text-[11px] text-neutral-500 mt-0.5'; price.textContent = fmt(p.price) + ' · ' + p.quantity + ' un';
        info.append(title, price); row.append(photo, info);
        if (step.id !== 'lv-step-3') {
          var controls = document.createElement('div'); controls.className = 'flex items-center gap-2 shrink-0';
          var number = document.createElement('span'); number.className = 'text-sm font-semibold text-neutral-900'; number.textContent = String(p.quantity);
          function button(symbol, label, delta) {
            var b = document.createElement('button'); b.type = 'button'; b.className = 'w-7 h-7 text-sm font-semibold text-neutral-900 border border-neutral-200 rounded-full'; b.textContent = symbol; b.setAttribute('aria-label', label + ' ' + p.name);
            b.addEventListener('click', function () {
              p.quantity = Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, p.quantity + delta));
              document.querySelectorAll('[data-lv-cart-items]').forEach(function (el) { el.remove(); });
              render(); document.dispatchEvent(new Event('lv-cart-change'));
            }); return b;
          }
          controls.append(button('−', 'Diminuir', -1), number, button('+', 'Aumentar', 1)); row.append(controls);
        }
        list.append(row);
      });
      original.insertAdjacentElement('afterend', list);
      if (step.id !== 'lv-step-3') original.style.display = 'none';
      else { img.style.display = 'none'; var text = original.querySelector('.flex-1'); if (text) { text.textContent = 'Produtos selecionados'; } }
    });
  }
  document.addEventListener('DOMContentLoaded', render);
})();