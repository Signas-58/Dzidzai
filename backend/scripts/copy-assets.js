const fs = require('fs');
const path = require('path');

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

function main() {
  const root = path.resolve(__dirname, '..');

  const mappings = [
    {
      src: path.join(root, 'src', 'modules', 'ai', 'prompts'),
      dest: path.join(root, 'dist', 'modules', 'ai', 'prompts'),
    },
  ];

  for (const m of mappings) {
    copyDir(m.src, m.dest);
  }
}

main();
