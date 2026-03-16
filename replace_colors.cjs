const fs = require('fs');
const path = require('path');

const replacements = {
  'brand-charcoal': 'deep-space-blue',
  'brand-verdigris': 'vivid-tangerine',
  'brand-tuscan': 'sunflower-gold',
  'brand-sandy': 'vanilla-custard',
  'brand-peach': 'flag-red'
};

const hexReplacements = {
  '#264653': '#003049',
  '#2a9d8f': '#f77f00',
  '#e9c46a': '#fcbf49',
  '#f4a261': '#eae2b7',
  '#e76f51': '#d62828'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [oldVal, newVal] of Object.entries(replacements)) {
      content = content.replace(new RegExp(oldVal, 'g'), newVal);
    }
    
    for (const [oldVal, newVal] of Object.entries(hexReplacements)) {
      content = content.replace(new RegExp(oldVal, 'g'), newVal);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
