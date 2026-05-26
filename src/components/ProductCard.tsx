import React, { useMemo } from 'react';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

function getMainTitle(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? '';
  return firstWord.toUpperCase();
}

function getTitleSizeClass(title: string): string {
  if (title.length >= 10) return 'figma-main-title-xl';
  if (title.length >= 8) return 'figma-main-title-lg';
  if (title.length >= 6) return 'figma-main-title-md';
  return '';
}

function getGramaje(name: string): string {
  const text = name.toUpperCase();

  const match = text.match(
    /(?:^|\s)(?:\d+\s*[Xx]\s*)?[Xx]?\s*(\d+(?:[,.]\d+)?)\s*(KG|KGS|G|GR|GRS|ML|L|LT|LTS|CC|U|UN|UND|UNID)\b/i
  );
  if (!match) return '';

  const value = match[1].replace(',', '.');
  const unitMap: Record<string, string> = {
    KG: 'kg',
    KGS: 'kg',
    G: 'g',
    GR: 'g',
    GRS: 'g',
    ML: 'ml',
    L: 'l',
    LT: 'l',
    LTS: 'l',
    CC: 'cc',
    U: 'u',
    UN: 'u',
    UND: 'u',
    UNID: 'u',
  };

  return `x ${value} ${unitMap[match[2].toUpperCase()] ?? match[2].toLowerCase()}`;
}

function removeGramajeFromName(name: string): string {
  return name
    .replace(/(?:^|\s)(?:\d+\s*[Xx]\s*)?[Xx]?\s*\d+(?:[,.]\d+)?\s*(KG|KGS|G|GR|GRS|ML|L|LT|LTS|CC|U|UN|UND|UNID)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizePrice(price: string): string {
  return price.replace(/\s/g, '').trim();
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const mainTitle = useMemo(() => getMainTitle(product.name), [product.name]);
  const gramaje = useMemo(() => getGramaje(product.name), [product.name]);
  const displayName = useMemo(() => removeGramajeFromName(product.name), [product.name]);
  const titleSizeClass = useMemo(() => getTitleSizeClass(mainTitle), [mainTitle]);
  const samePrice =
    normalizePrice(product.priceUnit) !== '' &&
    normalizePrice(product.priceUnit) !== '-' &&
    normalizePrice(product.priceUnit) === normalizePrice(product.priceBulk);

  return (
    <article className="catalog-page product-figma-page">
      <header className="figma-header">
        <div className="figma-title-row">
          <img
            src="/logo/decoracion .png"
            alt=""
            aria-hidden="true"
            className="figma-decoration figma-decoration-left"
          />

          <div className="figma-title-badge">
            <span className={`figma-main-title ${titleSizeClass}`}>{mainTitle}</span>
          </div>

          <img
            src="/logo/decoracion .png"
            alt=""
            aria-hidden="true"
            className="figma-decoration figma-decoration-right"
          />
        </div>

        <div className="figma-subtitle-row">
          <h2 className="figma-product-description">{displayName}</h2>

          {gramaje && (
            <div className="figma-weight-badge" aria-label={`Gramaje ${gramaje}`}>
              <div className="figma-weight-bg figma-weight-bg-yellow" />
              <div className="figma-weight-bg figma-weight-bg-blue" />
              <span className="figma-weight-text">{gramaje}</span>
            </div>
          )}
        </div>
      </header>

      <section className="figma-image-frame">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="figma-product-image"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith('.jpg')) {
                img.src = product.imageUrl.replace(/\.jpg$/i, '.png');
                return;
              }
              img.style.display = 'none';
            }}
          />
        ) : (
          <div className="figma-product-placeholder">Sin imagen</div>
        )}
      </section>

      <div className="figma-code-badge">Codigo: {product.code}</div>

      <section className={`figma-prices-frame ${samePrice ? 'single-price' : ''}`}>
        <div className="figma-price-card figma-price-unit">
          <div className="figma-price-tag">
            <span className="figma-price-value">{product.priceUnit || '-'}</span>
          </div>

          <div className="figma-price-title figma-price-title-unit">
            <div className="figma-price-title-bg figma-title-yellow" />
            <div className="figma-price-title-bg figma-title-blue" />
            <span className="figma-unit-label">X UNIDAD</span>
            <span className="figma-unit-line" />
          </div>
        </div>

        {!samePrice && (
          <div className="figma-price-card figma-price-bulk">
            <div className="figma-price-tag">
              <span className="figma-price-value">{product.priceBulk || '-'}</span>
            </div>

            <div className="figma-price-title figma-price-title-bulk">
              <div className="figma-price-title-bg figma-title-yellow" />
              <div className="figma-price-title-bg figma-title-blue" />
              <span className="figma-bulk-units">{product.unitsPerBulk}</span>
              <span className="figma-bulk-label">UNIDADES</span>
            </div>
          </div>
        )}
      </section>

      <img src="/logo/firmaGmail.png" alt="Pilar Distribuidora" className="figma-footer-logo" />
    </article>
  );
};
