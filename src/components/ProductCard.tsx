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

const GRAMAJE_PATTERN = /(?:^|\s)(?:\d+\s*[Xx]\s*)?[Xx]?\s*\d+(?:[,.]\d+)?\s*(?:KG|KGS|G|GR|GRS|ML|L|LT|LTS|CC|U|UN|UND|UNID)\b/gi;

function normalizeForCompare(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/gi, ' ')
    .trim()
    .toUpperCase();
}

function cleanGramaje(gramaje: string): string {
  return gramaje.replace(/^x\s*/i, '').replace(/\s+/g, ' ').trim();
}

function buildSubtitle(name: string, mainTitle: string, gramaje: string): string {
  const normalizedTitle = normalizeForCompare(mainTitle);
  const normalizedGramaje = normalizeForCompare(gramaje);
  const [, ...restWords] = name.trim().split(/\s+/);

  const subtitle = restWords
    .join(' ')
    .replace(GRAMAJE_PATTERN, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => normalizeForCompare(word) !== normalizedTitle)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!normalizedGramaje) return subtitle;

  return subtitle
    .replace(new RegExp(normalizedGramaje.replace(/\s+/g, '\\s+'), 'gi'), ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getSubtitleSizeClass(subtitle: string): string {
  if (subtitle.length >= 44) return 'figma-product-description-xs';
  if (subtitle.length >= 34) return 'figma-product-description-sm';
  if (subtitle.length >= 24) return 'figma-product-description-md';
  return '';
}

function normalizePrice(price: string): string {
  return price.replace(/\s/g, '').trim();
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const mainTitle = useMemo(() => getMainTitle(product.name), [product.name]);
  const gramaje = useMemo(() => cleanGramaje(product.gramaje), [product.gramaje]);
  const displayName = useMemo(
    () => buildSubtitle(product.name, mainTitle, gramaje),
    [product.name, mainTitle, gramaje]
  );
  const titleSizeClass = useMemo(() => getTitleSizeClass(mainTitle), [mainTitle]);
  const subtitleSizeClass = useMemo(() => getSubtitleSizeClass(displayName), [displayName]);
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
          <h2 className={`figma-product-description ${subtitleSizeClass}`}>{displayName}</h2>

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
            <span className="figma-price-label">UNIDAD</span>
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
              <span className="figma-price-label">BULTO</span>
              <span className="figma-unit-line" />
            </div>
          </div>
        )}
      </section>

      {product.bulkLabel && <p className="figma-bulk-note">{product.bulkLabel}</p>}

      <img src="/logo/firmaGmail.png" alt="Pilar Distribuidora" className="figma-footer-logo" />
    </article>
  );
};
