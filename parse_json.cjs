const fs = require('fs');
const jsonStr = fs.readFileSync('Documentos/Daily Scrum Report 2026-03-13.json', 'utf8');
const data = JSON.parse(jsonStr);
let text = '';
data.Pages.forEach(page => {
  page.Texts.forEach(t => {
    t.R.forEach(r => {
      text += decodeURIComponent(r.T) + '\n';
    });
  });
});
console.log(text);
