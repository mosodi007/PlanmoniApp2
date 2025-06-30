const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

async function extractZip() {
  try {
    const zipFileName = 'project-bolt-github-86dr6phv (1).zip';
    const extractPath = './extracted-project';
    
    // Check if zip file exists
    if (!fs.existsSync(zipFileName)) {
      console.error(`Zip file ${zipFileName} not found!`);
      return;
    }
    
    console.log(`Found zip file: ${zipFileName}`);
    console.log('Extracting...');
    
    // Create extraction directory if it doesn't exist
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }
    
    // Extract using yauzl
    await new Promise((resolve, reject) => {
      yauzl.open(zipFileName, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }
        
        zipfile.readEntry();
        
        zipfile.on('entry', (entry) => {
          const entryPath = path.join(extractPath, entry.fileName);
          
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            fs.mkdirSync(entryPath, { recursive: true });
            zipfile.readEntry();
          } else {
            // File entry
            // Ensure directory exists
            fs.mkdirSync(path.dirname(entryPath), { recursive: true });
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }
              
              const writeStream = fs.createWriteStream(entryPath);
              readStream.pipe(writeStream);
              
              writeStream.on('close', () => {
                zipfile.readEntry();
              });
              
              writeStream.on('error', reject);
            });
          }
        });
        
        zipfile.on('end', () => {
          resolve();
        });
        
        zipfile.on('error', reject);
      });
    });
    
    console.log(`Successfully extracted to: ${extractPath}`);
    
    // List contents of extracted directory
    console.log('\nExtracted contents:');
    const contents = fs.readdirSync(extractPath);
    contents.forEach(item => {
      const itemPath = path.join(extractPath, item);
      const stats = fs.statSync(itemPath);
      console.log(`${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${item}`);
    });
    
  } catch (error) {
    console.error('Error extracting zip:', error.message);
  }
}

extractZip();