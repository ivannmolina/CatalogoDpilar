import React, { useMemo, useState } from 'react';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

function getMainTitle(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? '';
  return firstWord.toUpperCase();
}

function getTitleSizeClass(title: string): string {
  if (title.length >= 13) return 'figma-main-title-xxl';
  if (title.length >= 10) return 'figma-main-title-xl';
  if (title.length >= 8) return 'figma-main-title-lg';
  if (title.length >= 6) return 'figma-main-title-md';
  return '';
}

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

function getPackQuantityBadge(name: string, gramaje: string): string {
  if (cleanGramaje(gramaje)) return '';

  const [, ...restWords] = name.trim().split(/\s+/);
  const match = restWords.join(' ').match(/(?:^|\s)X\s*(\d+)\b/i);
  return match ? `X${match[1]}` : '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeGramajeVariants(text: string, gramaje: string): string {
  const packQuantityMatch = gramaje.trim().match(/^x\s*(\d+)$/i);
  if (packQuantityMatch) {
    return text
      .replace(new RegExp(`(?:^|\\s)x\\s*${escapeRegExp(packQuantityMatch[1])}\\b`, 'gi'), ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  const match = gramaje.trim().match(/^(\d+(?:[,.]\d+)?)\s*(kg|kgs|g|gr|grs|ml|l|lt|lts|cc|u|un|und|unid)$/i);
  if (!match) return text;

  const value = escapeRegExp(match[1]).replace(/[,.]/g, '[,.]?');
  const unit = match[2].toLowerCase();
  const unitGroups: Record<string, string> = {
    kg: 'kg|kgs',
    kgs: 'kg|kgs',
    g: 'g|gr|grs',
    gr: 'g|gr|grs',
    grs: 'g|gr|grs',
    ml: 'ml',
    l: 'l|lt|lts',
    lt: 'l|lt|lts',
    lts: 'l|lt|lts',
    cc: 'cc',
    u: 'u|un|und|unid',
    un: 'u|un|und|unid',
    und: 'u|un|und|unid',
    unid: 'u|un|und|unid',
  };
  const unitPattern = unitGroups[unit] ?? escapeRegExp(unit);

  return text
    .replace(new RegExp(`(?:^|\\s)x?\\s*${value}\\s*(?:${unitPattern})\\.?\\b`, 'gi'), ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildSubtitle(name: string, mainTitle: string, gramaje: string): string {
  const normalizedTitle = normalizeForCompare(mainTitle);
  const [, ...restWords] = name.trim().split(/\s+/);

  const subtitle = restWords
    .join(' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => normalizeForCompare(word) !== normalizedTitle)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return removeGramajeVariants(subtitle, gramaje);
}

function getSubtitleSizeClass(subtitle: string): string {
  if (subtitle.length >= 62) return 'figma-product-description-xxs';
  if (subtitle.length >= 52) return 'figma-product-description-xs';
  if (subtitle.length >= 44) return 'figma-product-description-xs';
  if (subtitle.length >= 34) return 'figma-product-description-sm';
  if (subtitle.length >= 24) return 'figma-product-description-md';
  return '';
}

function normalizePrice(price: string): string {
  return price.replace(/\s/g, '').trim();
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageAttempt, setImageAttempt] = useState(0);
  const mainTitle = useMemo(() => getMainTitle(product.name), [product.name]);
  const gramaje = useMemo(
    () => cleanGramaje(product.gramaje) || getPackQuantityBadge(product.name, product.gramaje),
    [product.name, product.gramaje]
  );
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
  const imageSources = useMemo(
    () => [
      product.imageUrl,
      product.imageUrl.replace(/\.jpg$/i, '.png'),
      `/imagenesProductos/${product.code}.jpg`,
      `/imagenesProductos/${product.code}.png`,
    ].filter(Boolean),
    [product.code, product.imageUrl]
  );
  const imageSrc = imageSources[imageAttempt] ?? '';

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
        {imageSrc ? (
          <img
            key={imageSrc}
            src={imageSrc}
            alt={product.name}
            className="figma-product-image"
            onError={() => setImageAttempt((attempt) => attempt + 1)}
          />
        ) : (
          <div className="figma-product-placeholder" role="img" aria-label="Imagen no disponible">
            <img src="/logo/Logo1final.png" alt="" aria-hidden="true" className="figma-placeholder-logo" />
            <span>Imagen no disponible</span>
          </div>
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
