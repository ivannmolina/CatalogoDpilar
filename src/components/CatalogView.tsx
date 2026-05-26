import React, { useEffect, useMemo, useState } from 'react';
import type { Product } from '../types/product';
import { ProductCard } from './ProductCard';

interface CatalogViewProps {
  products: Product[];
  onRenderProgress?: (rendered: number, total: number) => void;
}

const PRODUCTS_PER_PAGE = 1;

const CoverPage: React.FC = () => (
  <div className="catalog-page cover-page">
    <img src="/logo/Portada.png" alt="Portada catálogo" className="cover-image" />
  </div>
);

export const CatalogView: React.FC<CatalogViewProps> = ({ products, onRenderProgress }) => {
  const [renderedCount, setRenderedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const total = products.length;

    setRenderedCount(0);
    onRenderProgress?.(0, total);

    const BATCH_SIZE = 8;

    const step = () => {
      if (cancelled) return;

      setRenderedCount((prev) => {
        const next = Math.min(prev + BATCH_SIZE, total);
        onRenderProgress?.(next, total);

        if (next < total) {
          requestAnimationFrame(step);
        }

        return next;
      });
    };

    requestAnimationFrame(step);

    return () => {
      cancelled = true;
    };
  }, [products, onRenderProgress]);

  const visibleProducts = useMemo(() => {
    const visible = products.slice(0, renderedCount);
    return visible.slice(0, Math.ceil(visible.length / PRODUCTS_PER_PAGE) * PRODUCTS_PER_PAGE);
  }, [products, renderedCount]);

  return (
    <div className="catalog-container">
      <CoverPage />

      {visibleProducts.map((product, pageIndex) => (
        <ProductCard
          key={`${pageIndex}-${product.code}-${product.name}`}
          product={product}
        />
      ))}
    </div>
  );
};
