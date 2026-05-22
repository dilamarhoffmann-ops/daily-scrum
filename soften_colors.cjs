const fs = require('fs');
const path = require('path');

const files = [
  'src/App.jsx',
  'src/components/dashboard/ExecutiveDashboard.jsx',
  'src/components/dashboard/StrategicMatrix.jsx',
  'src/components/common/ScrumCard.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Soften borders
    content = content.replace(/border-black/g, 'border-slate-200');
    // Soften text
    content = content.replace(/text-black/g, 'text-slate-800');
    // Soften backgrounds
    content = content.replace(/bg-black/g, 'bg-slate-800');
    // Change hover border
    content = content.replace(/hover:border-black/g, 'hover:border-slate-300');
    // Change hover text
    content = content.replace(/hover:text-black/g, 'hover:text-slate-800');
    // Change hover bg
    content = content.replace(/hover:bg-black/g, 'hover:bg-slate-800');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
