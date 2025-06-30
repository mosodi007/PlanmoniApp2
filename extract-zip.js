const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    // Use unzip command to extract
    execSync(`unzip -o "${zipFileName}" -d "${extractPath}"`, { stdio: 'inherit' });
    
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