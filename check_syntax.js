const fs = require('fs');

const content = fs.readFileSync('_layouts/default.html', 'utf8');

// Find all script blocks
const regex = /<script>([\s\S]*?)<\/script>/g;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  count++;
  const jsCode = match[1];
  console.log(`Checking script block ${count}...`);
  try {
    new Function(jsCode);
    console.log(`Script block ${count} is syntactically valid.`);
  } catch (e) {
    console.error(`Syntax error in script block ${count}:`, e.message);
    const lines = jsCode.split('\n');
    let partialCode = '';
    for (let i = 0; i < lines.length; i++) {
      partialCode += lines[i] + '\n';
      try {
        new Function(partialCode);
      } catch (err) {
        console.error(`Potential error start on block line ${i + 1}:`);
        console.error(lines.slice(Math.max(0, i - 5), i + 5).join('\n'));
        break;
      }
    }
  }
}
