/**
 * Scans content/legal directory for any unfinished [[placeholders]].
 * In production / CI or when executed, exits with code 1 if any placeholder remains.
 */
const fs = require('fs');
const path = require('path');

const legalDir = path.resolve(__dirname, '../content/legal');

if (!fs.existsSync(legalDir)) {
  console.log('[check:legal] Legal directory not found at:', legalDir);
  process.exit(0);
}

const files = fs.readdirSync(legalDir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json'));

let totalPlaceholders = 0;
const errors = [];

files.forEach((file) => {
  const filePath = path.join(legalDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const matches = line.match(/\[\[(.*?)\]\]/g);
    if (matches) {
      matches.forEach((m) => {
        totalPlaceholders++;
        errors.push({
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          placeholder: m,
          text: line.trim(),
        });
      });
    }
  });
});

console.log('\n--- RANOTE EXIM LEGAL AUDIT CHECK ---');
if (totalPlaceholders > 0) {
  console.error(`\x1b[31m[FAILED]\x1b[0m Found ${totalPlaceholders} unresolved [[placeholder]](s) in legal content:\n`);
  errors.forEach((err) => {
    console.error(`  \x1b[33m${err.file}:${err.line}\x1b[0m -> \x1b[31m${err.placeholder}\x1b[0m`);
    console.error(`    "${err.text}"\n`);
  });
  console.error('\x1b[31mBuild aborted.\x1b[0m All placeholders must be replaced with final legal wording before production deployment.\n');
  process.exit(1);
} else {
  console.log('\x1b[32m[PASSED]\x1b[0m All legal documents in content/legal are free of unresolved placeholders.\n');
  process.exit(0);
}

