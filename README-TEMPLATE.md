# Template de Ofertas (TEMPLATE-OFERTAS)

Template para montar lojas de produto único (funil TikTok Shop) trocando apenas o
produto, sem mexer no código das páginas.

## Como funciona

Tudo que define o produto fica em **um único arquivo**: `product.json`.

O script `js/product-loader.js` lê esse arquivo e injeta os dados em todas as
páginas do funil automaticamente (nome, preços, imagens, vídeos, avaliações e
meta tags de SEO).

```
product.json          ← fonte de verdade (edite aqui)
js/product-loader.js  ← injeta os dados nas páginas
admin.html            ← painel visual para editar/gerar/buscar conteúdo
```

## Fluxo de trabalho (trocar de produto)

1. Abra `admin.html` no navegador.
2. Digite o **nome do produto**.
3. Clique em **"Gerar avaliações a partir do nome"** (cria comentários realistas).
4. Use **"Buscar conteúdo real"** para abrir YouTube/Google/TikTok e encontrar
   vídeos e fotos reais do produto. Cole as URLs nos campos de imagens/vídeos.
5. Ajuste preços, cores e benefícios.
6. Clique em **"Salvar product.json"** e substitua o arquivo na raiz do projeto.

Pronto: todas as páginas passam a exibir o novo produto.

## Campos do product.json

| Campo | Descrição |
|-------|-----------|
| `nome` | Nome completo do produto |
| `nomeCurto` | Nome curto (cards e botões) |
| `marca` | Marca |
| `descricao` | Descrição curta (SEO) |
| `preco` | Preço principal (R$) |
| `precoAntigo` | Preço riscado / "de" (R$) |
| `precoPix` | Preço à vista no Pix (R$) |
| `parcelas` / `valorParcela` | Parcelamento |
| `cores` | Variações (nome, preço, imagem) |
| `imagens` | Galeria de fotos |
| `video` / `videos` | Vídeos de demonstração |
| `beneficios` | Selos (frete grátis, garantia...) |
| `avaliacoes` | Comentários do feed "em tempo real" |
| `meta` | Título e descrição SEO |

## Como o loader injeta os dados

- **Meta tags**: `title`, `description`, `og:*`, `twitter:*` são atualizadas.
- **Atributos `data-product`**: qualquer elemento com `data-product="chave"`
  recebe o valor (texto) ou `src` (imagens). Ex.: `<span data-product="preco">`.
- **Avaliações**: expõe `window.PRODUCT.avaliacoes` e dispara o evento
  `product:reviews` para páginas que renderizam o feed dinamicamente.

## Observações

- O checkout (PIX via ClownPay) já está integrado e usa os preços gravados em
  `localStorage` durante a navegação. O preço principal vem do `product.json`.
- Para adicionar o loader a uma página, inclua antes do `</body>`:
  ```html
  <script src="js/product-loader.js"></script>
  ```
- O `admin.html` baixa o `product.json` editado; substitua o arquivo na raiz e
  faça o commit para publicar.
