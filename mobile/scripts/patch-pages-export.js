const { copyFileSync, existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const outputDir = join(__dirname, '..', 'dist-pages');
const indexPath = join(outputDir, 'index.html');

if (!existsSync(indexPath)) {
  throw new Error(`Missing Expo web export at ${indexPath}`);
}

const html = readFileSync(indexPath, 'utf8')
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./');

writeFileSync(indexPath, html);
writeFileSync(join(outputDir, '.nojekyll'), '');
copyFileSync(indexPath, join(outputDir, '404.html'));
