import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const inputDir = path.resolve(root, process.argv[2] ?? 'public/imagenesProductos');
const outputDir = path.resolve(root, process.argv[3] ?? 'public/imagenesProductos-optimized');

const MAX_WIDTH = Number(process.env.IMAGE_MAX_WIDTH ?? 1200);
const MAX_HEIGHT = Number(process.env.IMAGE_MAX_HEIGHT ?? 1200);
const JPEG_QUALITY = Number(process.env.IMAGE_JPEG_QUALITY ?? 76);
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY ?? 78);
const PNG_COMPRESSION_LEVEL = Number(process.env.IMAGE_PNG_COMPRESSION_LEVEL ?? 9);

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function collectImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectImages(fullPath));
      continue;
    }

    if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function optimizeImage(inputPath) {
  const relativePath = path.relative(inputDir, inputPath);
  const outputPath = path.join(outputDir, relativePath);
  const extension = path.extname(inputPath).toLowerCase();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  let pipeline = sharp(inputPath, { animated: false })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (extension === '.jpg' || extension === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else if (extension === '.webp') {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY, effort: 5 });
  } else if (extension === '.png') {
    pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION_LEVEL, palette: true });
  }

  await pipeline.toFile(outputPath);

  const [before, after] = await Promise.all([
    fs.stat(inputPath),
    fs.stat(outputPath),
  ]);

  return { before: before.size, after: after.size, relativePath };
}

async function main() {
  const files = await collectImages(inputDir);

  if (files.length === 0) {
    console.log(`No se encontraron imágenes en ${inputDir}`);
    return;
  }

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  let optimized = 0;

  for (const file of files) {
    try {
      const result = await optimizeImage(file);
      totalBefore += result.before;
      totalAfter += result.after;
      optimized += 1;
    } catch (error) {
      console.warn(`No se pudo optimizar ${path.relative(inputDir, file)}:`, error.message);
    }
  }

  const saved = totalBefore - totalAfter;
  const percent = totalBefore > 0 ? ((saved / totalBefore) * 100).toFixed(1) : '0.0';

  console.log('Optimización finalizada');
  console.log(`Entrada: ${inputDir}`);
  console.log(`Salida: ${outputDir}`);
  console.log(`Imágenes procesadas: ${optimized}/${files.length}`);
  console.log(`Peso original: ${formatBytes(totalBefore)}`);
  console.log(`Peso optimizado: ${formatBytes(totalAfter)}`);
  console.log(`Ahorro: ${formatBytes(saved)} (${percent}%)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
