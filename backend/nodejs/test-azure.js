/**
 * ========================================
 * AZURE BLOB STORAGE INTEGRATION TEST
 * ========================================
 * 
 * Purpose: Test Azure Blob Storage connectivity and operations
 * 
 * Description:
 * This script tests the Azure Blob Storage service to ensure
 * it can connect, upload, and retrieve files properly.
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Backend Team
 */

import dotenv from 'dotenv';
import azureBlobService from './services/azureBlobService.js';

// Load environment variables
dotenv.config();

async function testAzureBlobStorage() {
  console.log('🧪 Testing Azure Blob Storage Integration...\n');

  // Test 1: Check if Azure is configured
  console.log('1️⃣ Checking Azure configuration...');
  if (!azureBlobService.isAvailable) {
    console.log('❌ Azure Blob Storage not available');
    console.log('   - Check your AZURE_STORAGE_CONNECTION_STRING in .env');
    console.log('   - Make sure your Azure storage account is accessible');
    return;
  }
  console.log('✅ Azure Blob Storage is available\n');

  // Test 2: Create a test file
  console.log('2️⃣ Creating test file...');
  const testData = 'Date,Sales,Price,Category\n2024-01-01,1000,10.5,A\n2024-01-02,1200,11.0,B\n2024-01-03,900,9.8,A';
  const testBuffer = Buffer.from(testData, 'utf-8');
  console.log('✅ Test file created\n');

  // Test 3: Upload test file
  console.log('3️⃣ Uploading test file to Azure Blob Storage...');
  try {
    const uploadResult = await azureBlobService.uploadFile(
      testBuffer,
      'test-file.csv',
      'test-brand',
      'text/csv'
    );
    
    console.log('✅ File uploaded successfully:');
    console.log(`   - Filename: ${uploadResult.filename}`);
    console.log(`   - Size: ${uploadResult.size} bytes`);
    console.log(`   - URL: ${uploadResult.url}\n`);

    // Test 4: Download and parse the file
    console.log('4️⃣ Downloading and parsing file...');
    const downloadedBuffer = await azureBlobService.downloadFile(uploadResult.filename);
    const parsedData = await azureBlobService.parseFileData(downloadedBuffer, 'test-file.csv');
    
    console.log('✅ File downloaded and parsed successfully:');
    console.log(`   - Columns: ${parsedData.columns.length}`);
    console.log(`   - Total rows: ${parsedData.totalRows}`);
    console.log(`   - Sample data: ${parsedData.sampleData.length} rows\n`);

    // Test 5: Get file metadata
    console.log('5️⃣ Getting file metadata...');
    const metadata = await azureBlobService.getFileMetadata(uploadResult.filename);
    
    console.log('✅ File metadata retrieved:');
    console.log(`   - Size: ${metadata.size} bytes`);
    console.log(`   - Content type: ${metadata.contentType}`);
    console.log(`   - Last modified: ${metadata.lastModified}\n`);

    // Test 6: List brand files
    console.log('6️⃣ Listing brand files...');
    const brandFiles = await azureBlobService.listBrandFiles('test-brand');
    
    console.log('✅ Brand files listed:');
    console.log(`   - Found ${brandFiles.length} files`);
    brandFiles.forEach((file, index) => {
      console.log(`   - ${index + 1}. ${file.name} (${file.size} bytes)`);
    });
    console.log('');

    // Test 7: Clean up - delete test file
    console.log('7️⃣ Cleaning up test file...');
    await azureBlobService.deleteFile(uploadResult.filename);
    console.log('✅ Test file deleted\n');

    console.log('🎉 All Azure Blob Storage tests passed!');
    console.log('✅ Your Azure integration is working correctly\n');

  } catch (error) {
    console.error('❌ Azure Blob Storage test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your AZURE_STORAGE_CONNECTION_STRING in .env');
    console.log('2. Verify your Azure storage account is active');
    console.log('3. Make sure the container "brandbloom-files" exists');
    console.log('4. Check your network connection to Azure');
    console.log('5. Verify your Azure account has the necessary permissions\n');
  }
}

// Run the test
testAzureBlobStorage().catch(console.error);
