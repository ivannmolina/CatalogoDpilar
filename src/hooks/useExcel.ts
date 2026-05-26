import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Product } from '../types/product';

interface UseExcelReturn {
  products: Product[];
  error: string | null;
  loading: boolean;
  parseFile: (file: File) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formatea precio:
 * - Solo parte entera
 * - Agrega $
 * - Maneja tanto número como string "$2.370,00" (formato AR)
 */
function formatPrice(raw: unknown): string {
  if (raw === '' || raw === null || raw === undefined) return '';

  let value: number;

  if (typeof raw === 'number') {
    value = raw;
  } else {
    const str = String(raw)
      .replace(/\$/g, '')
      .replace(/\./g, '')   // miles: $2.370,00
      .replace(',', '.');   // decimal
    value = parseFloat(str);
  }

  if (isNaN(value)) return String(raw);
  return `$${Math.floor(value).toLocaleString('es-AR')}`;
}

function buildImageUrlFromCode(rawCode: unknown): string {
  const code = String(rawCode ?? '').trim();
  if (!code) return '';

  // Ruta requerida: public/imagenesProductos/{codigo}.jpg
  return `/imagenesProductos/${encodeURIComponent(code)}.jpg`;
}

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function pick(row: Record<string, unknown>, keys: string[]): unknown {
  const normalizedRow = new Map<string, unknown>();

  Object.entries(row).forEach(([key, value]) => {
    normalizedRow.set(normalizeHeader(key), value);
  });

  for (const key of keys) {
    const value = row[key] ?? normalizedRow.get(normalizeHeader(key));
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function formatPlainText(raw: unknown): string {
  if (raw === '' || raw === null || raw === undefined) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

function formatGramaje(raw: unknown): string {
  const value = formatPlainText(raw);
  if (!value) return '';

  return value
    .replace(/^x\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatUnitsPerBulk(raw: unknown): string {
  if (raw === '' || raw === null || raw === undefined) return 'X0';

  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
  if (isNaN(num)) return `X${String(raw).trim()}`;
  return `X${Math.floor(num)}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useExcel(): UseExcelReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parseFile = useCallback((file: File) => {
    setLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!(data instanceof ArrayBuffer)) throw new Error('No se pudo leer el archivo.');

        // ── Parser simple: solo datos del Excel, sin imágenes embebidas ────
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const sheet = workbook.Sheets['LISTA ACTUAL'];

        if (!sheet) {
          throw new Error(
            `No se encontró la hoja "LISTA ACTUAL". Hojas disponibles: ${workbook.SheetNames.join(', ')}`
          );
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
        });

        const parsed: Product[] = rows
          .filter((row) => {
            const code = String(pick(row, ['Código', 'Codigo'])).trim();
            const name = String(pick(row, ['Denominación', 'Denominacion'])).trim();
            return code.length > 0 || name.length > 0;
          })
          .map((row) => ({
            code: String(pick(row, ['Código', 'Codigo'])).trim(),
            name: String(pick(row, ['Denominación', 'Denominacion'])).trim(),
            gramaje: formatGramaje(pick(row, ['gramaje', 'Gramaje'])),
            priceUnit: formatPrice(pick(row, ['Precio por unidad', 'Precio por u', 'Precio unidad'])),
            priceBulk: formatPrice(pick(row, ['Precio por bulto', 'Precio bulto'])),
            imageUrl: buildImageUrlFromCode(pick(row, ['Código', 'Codigo'])),
            unitsPerBulk: formatUnitsPerBulk(pick(row, ['Unidades por bulto', 'Unidades por bul', 'Unidades'])),
            bulkLabel: formatPlainText(
              pick(row, [
                'Comentario etiquetaxbulto',
                'etiquetaxbulto',
                'Etiqueta x bulto',
                'Etiqueta por bulto',
              ])
            ),
          }));

        setProducts(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  return { products, error, loading, parseFile };
}
