import React, { useCallback, useMemo, useState } from 'react';
import { useExcel } from './hooks/useExcel';
import { CatalogView } from './components/CatalogView';

const DEFAULT_RANGE_FROM = 1;
const DEFAULT_RANGE_TO = 50;

const App: React.FC = () => {
  const { products, error, loading, parseFile } = useExcel();
  const [isDragging, setIsDragging] = useState(false);
  const [renderProgress, setRenderProgress] = useState({ rendered: 0, total: 0 });
  const [rangeFromInput, setRangeFromInput] = useState<string>(String(DEFAULT_RANGE_FROM));
  const [rangeToInput, setRangeToInput] = useState<string>(String(DEFAULT_RANGE_TO));

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.name.endsWith('.xlsx')) parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const hasCatalog = products.length > 0;
  const maxProductIndex = products.length;

  const safeFrom = Math.max(1, Math.min(parseInt(rangeFromInput || '1', 10) || 1, maxProductIndex || 1));
  const safeTo = Math.max(
    safeFrom,
    Math.min(parseInt(rangeToInput || String(DEFAULT_RANGE_TO), 10) || safeFrom, maxProductIndex || safeFrom)
  );

  const selectedProducts = useMemo(
    () => (hasCatalog ? products.slice(safeFrom - 1, safeTo) : []),
    [hasCatalog, products, safeFrom, safeTo]
  );
  const totalInRange = selectedProducts.length;

  const isRenderingCatalog = hasCatalog && renderProgress.rendered < renderProgress.total;
  const canPrintBlock = hasCatalog && totalInRange > 0 && !isRenderingCatalog;

  const handleApplyDefaultRange = useCallback(() => {
    setRangeFromInput(String(DEFAULT_RANGE_FROM));
    const maxTo = Math.min(DEFAULT_RANGE_TO, maxProductIndex || DEFAULT_RANGE_TO);
    setRangeToInput(String(maxTo));
  }, [maxProductIndex]);

  const handleRenderProgress = useCallback((rendered: number, total: number) => {
    setRenderProgress({ rendered, total });
  }, []);

  const handlePrint = useCallback(async () => {
    // Evita imprimir antes de que Lilita One termine de cargar.
    // Si la fuente no está lista, Chromium puede usar fallback o rasterizar peor.
    if ('fonts' in document) {
      await document.fonts.ready;
    }

    window.print();
  }, []);

  return (
    <>
      {/* Panel de carga — se oculta en impresión */}
      <div className="upload-panel no-print">
        <div className="upload-header">
          <h1 className="upload-title">
            <span className="upload-title-brand">Distribuidora Pilar</span>
            <br />
            Generador de Catálogo
          </h1>
          <p className="upload-subtitle">
            Cargá tu archivo Excel con la hoja <strong>"LISTA ACTUAL"</strong> y generá el catálogo
            listo para imprimir.
          </p>
        </div>

        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <svg
            className="upload-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
            />
          </svg>
          <p className="upload-dropzone-text">
            {isDragging ? 'Soltá el archivo acá' : 'Arrastrá tu archivo .xlsx o'}
          </p>
          <label className="upload-btn">
            Seleccionar archivo
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {loading && (
          <div className="upload-status loading">
            <div className="spinner" />
            <span>Procesando archivo...</span>
          </div>
        )}

        {error && (
          <div className="upload-status error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {hasCatalog && !loading && (
          <div className="upload-status success upload-status-column">
            ✅ <strong>{products.length} productos</strong> cargados correctamente.{' '}

            <div className="range-controls">
              <label className="range-field">
                <span>Desde</span>
                <input
                  type="number"
                  min={1}
                  max={maxProductIndex}
                  value={rangeFromInput}
                  onChange={(e) => setRangeFromInput(e.target.value)}
                />
              </label>

              <label className="range-field">
                <span>Hasta</span>
                <input
                  type="number"
                  min={1}
                  max={maxProductIndex}
                  value={rangeToInput}
                  onChange={(e) => setRangeToInput(e.target.value)}
                />
              </label>

              <button type="button" className="range-reset-btn" onClick={handleApplyDefaultRange}>
                1-50
              </button>
            </div>

            <span className="range-summary">
              Rango activo: {safeFrom}-{safeTo} ({totalInRange} productos)
            </span>

            {isRenderingCatalog ? (
              <span className="render-progress-text">
                Renderizando productos ({renderProgress.rendered}/{renderProgress.total || totalInRange})
              </span>
            ) : (
              <button className="print-btn" onClick={handlePrint} disabled={!canPrintBlock}>
                🖨 Imprimir / Guardar PDF
              </button>
            )}
          </div>
        )}
      </div>

      {/* Catálogo generado */}
      {hasCatalog && (
        <CatalogView
          products={selectedProducts}
          onRenderProgress={handleRenderProgress}
        />
      )}
    </>
  );
};

export default App;
