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
    
    // Move files from extracted-project/project to root
    const projectPath = path.join(extractPath, 'project');
    if (fs.existsSync(projectPath)) {
      console.log('Moving files to root directory...');
      
      function moveRecursively(src, dest) {
        const items = fs.readdirSync(src);
        
        for (const item of items) {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);
          const stats = fs.statSync(srcPath);
          
          if (stats.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            moveRecursively(srcPath, destPath);
          } else {
            // Ensure destination directory exists
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      
      moveRecursively(projectPath, './');
      
      // Clean up extracted directory
      fs.rmSync(extractPath, { recursive: true, force: true });
      
      console.log('Files moved to root directory successfully!');
    }
    
    // List contents of root directory
    console.log('\nRoot directory contents:');
    const contents = fs.readdirSync('./');
    contents.forEach(item => {
      const itemPath = path.join('./', item);
      const stats = fs.statSync(itemPath);
      console.log(`${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${item}`);
    });
    
  } catch (error) {
    console.error('Error extracting zip:', error.message);
  }
}

extractZip();