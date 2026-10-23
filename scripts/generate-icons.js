import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function drawRadarPixel(x, y, w, h) {
  const nx = x / (w - 1);
  const ny = y / (h - 1);

  // Rounded rectangle
  const r = 0.22;
  const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - r));
  const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - r));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > r) return [0, 0, 0, 0];

  // Cyan #06b6d4 to Reverb Red #ff2d20 gradient background
  const grad = nx * 0.4 + ny * 0.6;
  const rBg = Math.round(6 + (255 - 6) * grad);
  const gBg = Math.round(182 + (45 - 182) * grad);
  const bBg = Math.round(212 + (32 - 212) * grad);

  // Center circle and broadcast waves
  const cx = 0.5;
  const cy = 0.5;
  const cDist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);

  // Center dot
  if (cDist < 0.1) return [255, 255, 255, 255];

  // Wave 1
  if (cDist >= 0.22 && cDist <= 0.28) return [255, 255, 255, 240];

  // Wave 2
  if (cDist >= 0.36 && cDist <= 0.42) return [255, 255, 255, 200];

  return [rBg, gBg, bBg, 255];
}

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const size of [16, 32, 48, 128]) {
  const png = createPng(size, size, drawRadarPixel);
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Generated ${filePath}`);
}
