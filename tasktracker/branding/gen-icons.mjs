import sharp from 'sharp';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve('C:/Games/magical-task-tracker/tasktracker/public/selene icon.png');
const iconsDir = path.resolve('C:/Games/magical-task-tracker/tasktracker/src-tauri/icons');
const publicDir = path.resolve('C:/Games/magical-task-tracker/tasktracker/public');

// Add a soft dark background (berry-midnight gradient sim via solid) so crescent shows on any bg
// We'll composite the logo onto a rounded square with a deep night background
async function makeBase(size) {
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1535"/>
          <stop offset="100%" stop-color="#2b1040"/>
        </linearGradient>
        <clipPath id="r">
          <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" ry="${Math.round(size * 0.22)}"/>
        </clipPath>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" ry="${Math.round(size * 0.22)}" fill="url(#g)"/>
    </svg>`
  );

  const padding = Math.round(size * 0.1);
  const logoSize = size - padding * 2;

  return sharp(bg)
    .composite([{
      input: await sharp(src).resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      top: padding,
      left: padding,
    }])
    .png();
}

async function save(pipeline, filePath) {
  await pipeline.toFile(filePath);
  console.log('✓', filePath.replace(path.resolve('C:/Games/magical-task-tracker/tasktracker'), ''));
}

async function run() {
  // Standard PNG sizes
  const sizes = [
    { file: `${iconsDir}/32x32.png`,             size: 32  },
    { file: `${iconsDir}/64x64.png`,             size: 64  },
    { file: `${iconsDir}/128x128.png`,           size: 128 },
    { file: `${iconsDir}/128x128@2x.png`,        size: 256 },
    { file: `${iconsDir}/icon.png`,              size: 512 },
    // Windows Store / MSIX square logos
    { file: `${iconsDir}/Square30x30Logo.png`,   size: 30  },
    { file: `${iconsDir}/Square44x44Logo.png`,   size: 44  },
    { file: `${iconsDir}/Square71x71Logo.png`,   size: 71  },
    { file: `${iconsDir}/Square89x89Logo.png`,   size: 89  },
    { file: `${iconsDir}/Square107x107Logo.png`, size: 107 },
    { file: `${iconsDir}/Square142x142Logo.png`, size: 142 },
    { file: `${iconsDir}/Square150x150Logo.png`, size: 150 },
    { file: `${iconsDir}/Square284x284Logo.png`, size: 284 },
    { file: `${iconsDir}/Square310x310Logo.png`, size: 310 },
    { file: `${iconsDir}/StoreLogo.png`,         size: 50  },
    // PWA icons in public/
    { file: `${publicDir}/icons/icon-72x72.png`,   size: 72  },
    { file: `${publicDir}/icons/icon-96x96.png`,   size: 96  },
    { file: `${publicDir}/icons/icon-128x128.png`, size: 128 },
    { file: `${publicDir}/icons/icon-144x144.png`, size: 144 },
    { file: `${publicDir}/icons/icon-152x152.png`, size: 152 },
    { file: `${publicDir}/icons/icon-192x192.png`, size: 192 },
    { file: `${publicDir}/icons/icon-384x384.png`, size: 384 },
    { file: `${publicDir}/icons/icon-512x512.png`, size: 512 },
  ];

  for (const { file, size } of sizes) {
    await save(await makeBase(size), file);
  }

  // favicon.ico (multi-size: 16, 32, 48)
  const ico16 = await (await makeBase(16)).toBuffer();
  const ico32 = await (await makeBase(32)).toBuffer();
  const ico48 = await (await makeBase(48)).toBuffer();
  // sharp can't write .ico directly — use the 32px PNG as favicon for now
  await (await makeBase(32)).toFile(`${publicDir}/favicon.ico`);
  console.log('✓ /public/favicon.ico (32px)');

  // macOS icns — generate a 1024 source and let Tauri CLI handle it,
  // but also write a best-effort 1024 PNG that Tauri's icon command expects
  await save(await makeBase(1024), `${iconsDir}/icon.icns`);

  console.log('\nAll icons generated! Note: icon.icns is a PNG renamed — run `cargo tauri icon` for a proper macOS icns if needed.');
}

run().catch(err => { console.error(err); process.exit(1); });
