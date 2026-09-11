const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'dist', 'index.html');
const dest = path.resolve(__dirname, '..', 'api', 'seo', '_index.template.html');

if (!fs.existsSync(src)) {
  console.error('[copy-html-template] dist/index.html não encontrado. Execute o build antes.');
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log('[copy-html-template] index.html copiado para api/_index.template.html');
