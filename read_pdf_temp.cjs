const fs = require('fs');
const pdf = require('pdf-parse');

const targetPDF = 'Documentos/Daily Scrum Report 2026-03-12 (1).pdf';
const dataBuffer = fs.readFileSync(targetPDF);

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(console.error);
