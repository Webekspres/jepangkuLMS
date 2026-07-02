const XLSX = require('xlsx');
const path = require('path');

const files = [
  '/c/Users/Developer-Webekspres/Downloads/jepangku/N4.xlsx',
  '/c/Users/Developer-Webekspres/Downloads/jepangku/N5.xlsx'
];

function examineWorkbook(filePath) {
  console.log('\n' + '='.repeat(80));
  console.log(`FILE: ${path.basename(filePath)}`);
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);

  console.log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);
  console.log(`Number of Sheets: ${workbook.SheetNames.length}`);

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const numRows = range.e.r + 1;
    const numCols = range.e.c + 1;

    console.log(`\n--- Sheet ${index + 1}: "${sheetName}" ---`);
    console.log(`Dimensions: ${worksheet['!ref']}`);
    console.log(`Rows: ${numRows}, Columns: ${numCols}`);

    // Get headers (first row)
    const headers = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({r: 0, c});
      const cell = worksheet[cellAddr];
      headers.push(cell ? cell.v : `Column_${c}`);
    }
    console.log(`Headers: ${headers.join(' | ')}`);

    // Get first 5 data rows
    console.log('\nFirst 5 data rows:');
    for (let r = 1; r <= Math.min(5, numRows - 1); r++) {
      const rowData = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({r, c});
        const cell = worksheet[cellAddr];
        rowData.push(cell ? cell.v : '');
      }
      console.log(`  Row ${r}: ${rowData.join(' | ')}`);
    }

    // Also show as JSON for first 3 rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
    if (jsonData.length > 1) {
      console.log('\nAs JSON (first 3 rows):');
      jsonData.slice(1, 4).forEach((row, i) => {
        console.log(`  ${JSON.stringify(row)}`);
      });
    }
  });
}

files.forEach(file => {
  try {
    examineWorkbook(file);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});