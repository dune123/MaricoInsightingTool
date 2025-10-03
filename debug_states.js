const fs = require('fs');
const path = require('path');

async function debugStates() {
  try {
    const stateDir = path.join('backend', 'nodejs', 'metadata', 'concatenation_states');
    console.log('Checking directory:', stateDir);
    console.log('Directory exists:', fs.existsSync(stateDir));
    
    const files = fs.readdirSync(stateDir);
    console.log('All files:', files);
    
    const stateFiles = files.filter(file => file.endsWith('_state.json'));
    console.log('State files:', stateFiles);
    
    const states = [];
    for (const file of stateFiles) {
      try {
        console.log(`Reading file: ${file}`);
        const stateData = JSON.parse(fs.readFileSync(path.join(stateDir, file), 'utf8'));
        console.log(`File ${file} has keys:`, Object.keys(stateData));
        console.log(`originalFileName: ${stateData.originalFileName}`);
        console.log(`savedAt: ${stateData.savedAt}`);
        console.log(`status: ${stateData.status}`);
        states.push({
          stateFileName: file,
          originalFileName: stateData.originalFileName,
          savedAt: stateData.savedAt,
          status: stateData.status || 'completed'
        });
      } catch (error) {
        console.warn(`Skipping corrupted state file ${file}:`, error.message);
      }
    }
    
    console.log('Final states array:', states);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugStates();
