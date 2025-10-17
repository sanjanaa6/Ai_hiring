/**
 * Check if AWS S3 Bucket exists and is accessible
 */

require('dotenv').config({ path: './backend/.env' });
const { S3Client, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkS3Bucket() {
  console.log('\n' + '='.repeat(70));
  log('🪣 AWS S3 Bucket Check', 'blue');
  console.log('='.repeat(70) + '\n');

  // Check environment variables
  log('📋 Step 1: Checking AWS Configuration...', 'yellow');
  
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'ai-hiring-recordings';
  const region = process.env.AWS_REGION || 'us-east-1';

  console.log(`   Bucket Name: ${bucketName}`);
  console.log(`   Region: ${region}`);
  console.log(`   Access Key: ${awsAccessKey ? '✅ Set (' + awsAccessKey.substring(0, 8) + '...)' : '❌ Not Set'}`);
  console.log(`   Secret Key: ${awsSecretKey ? '✅ Set (' + '*'.repeat(20) + ')' : '❌ Not Set'}`);

  if (!awsAccessKey || !awsSecretKey) {
    log('\n❌ AWS credentials are NOT configured!', 'red');
    log('\n💡 To configure AWS S3:', 'blue');
    log('1. Open backend/.env file', 'yellow');
    log('2. Add these lines:', 'yellow');
    log('   AWS_ACCESS_KEY_ID=your-access-key-id', 'yellow');
    log('   AWS_SECRET_ACCESS_KEY=your-secret-access-key', 'yellow');
    log('   AWS_S3_BUCKET_NAME=ai-hiring-recordings', 'yellow');
    log('   AWS_REGION=us-east-1', 'yellow');
    log('\n3. Create the bucket in AWS Console:', 'yellow');
    log('   - Go to https://s3.console.aws.amazon.com/', 'yellow');
    log('   - Click "Create bucket"', 'yellow');
    log('   - Name: ai-hiring-recordings', 'yellow');
    log('   - Region: us-east-1 (or your preferred region)', 'yellow');
    log('   - Keep default settings (Block all public access)', 'yellow');
    log('   - Click "Create bucket"', 'yellow');
    
    log('\n⚠️  Current Status: Using LOCAL FILE STORAGE', 'yellow');
    log('   Recordings will be saved to: backend/uploads/recordings/', 'yellow');
    log('   This is fine for development and testing!', 'green');
    
    console.log('\n' + '='.repeat(70) + '\n');
    return;
  }

  // Try to connect to S3
  log('\n🔌 Step 2: Connecting to AWS S3...', 'yellow');
  
  try {
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey
      }
    });

    log('✅ S3 Client initialized', 'green');

    // Check if bucket exists
    log('\n🪣 Step 3: Checking if bucket exists...', 'yellow');
    
    try {
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(headCommand);
      
      log(`✅ Bucket "${bucketName}" exists and is accessible!`, 'green');

      // List objects in bucket
      log('\n📁 Step 4: Checking bucket contents...', 'yellow');
      
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 10
        });
        const response = await s3Client.send(listCommand);

        if (response.Contents && response.Contents.length > 0) {
          log(`✅ Found ${response.Contents.length} object(s) in bucket:`, 'green');
          response.Contents.forEach(obj => {
            const sizeMB = (obj.Size / 1024 / 1024).toFixed(2);
            log(`   - ${obj.Key} (${sizeMB} MB)`, 'green');
          });
        } else {
          log('   Bucket is empty (no recordings yet)', 'yellow');
        }

        if (response.KeyCount !== undefined) {
          log(`\n📊 Total objects: ${response.KeyCount}`, 'blue');
        }
      } catch (listError) {
        log(`⚠️  Could not list bucket contents: ${listError.message}`, 'yellow');
      }

      // Summary
      console.log('\n' + '='.repeat(70));
      log('✅ AWS S3 is CONFIGURED and WORKING!', 'green');
      console.log('='.repeat(70));
      log(`Bucket: ${bucketName}`, 'green');
      log(`Region: ${region}`, 'green');
      log('Status: Ready to store recordings', 'green');
      console.log('='.repeat(70) + '\n');

    } catch (bucketError) {
      if (bucketError.name === 'NotFound' || bucketError.$metadata?.httpStatusCode === 404) {
        log(`❌ Bucket "${bucketName}" does NOT exist!`, 'red');
        
        log('\n💡 To create the bucket:', 'blue');
        log('Option 1: AWS Console (Easiest)', 'yellow');
        log('1. Go to https://s3.console.aws.amazon.com/', 'yellow');
        log('2. Click "Create bucket"', 'yellow');
        log(`3. Bucket name: ${bucketName}`, 'yellow');
        log(`4. Region: ${region}`, 'yellow');
        log('5. Keep "Block all public access" enabled', 'yellow');
        log('6. Click "Create bucket"', 'yellow');
        
        log('\nOption 2: AWS CLI', 'yellow');
        log(`aws s3 mb s3://${bucketName} --region ${region}`, 'yellow');
        
        log('\n⚠️  Until bucket is created: Using LOCAL FILE STORAGE', 'yellow');
        
      } else if (bucketError.name === 'Forbidden' || bucketError.$metadata?.httpStatusCode === 403) {
        log(`❌ Access Denied to bucket "${bucketName}"!`, 'red');
        log('   Your AWS credentials do not have permission to access this bucket.', 'red');
        log('\n💡 Check:', 'blue');
        log('1. Are the AWS credentials correct?', 'yellow');
        log('2. Does the IAM user have S3 permissions?', 'yellow');
        log('3. Is the bucket in the correct region?', 'yellow');
        
      } else {
        log(`❌ Error checking bucket: ${bucketError.message}`, 'red');
        log(`   Error code: ${bucketError.name}`, 'red');
      }
      
      console.log('\n' + '='.repeat(70) + '\n');
    }

  } catch (error) {
    log(`❌ Failed to connect to AWS S3: ${error.message}`, 'red');
    log('\n💡 Possible issues:', 'blue');
    log('1. Invalid AWS credentials', 'yellow');
    log('2. Network connectivity issues', 'yellow');
    log('3. AWS service outage', 'yellow');
    
    log('\n⚠️  Fallback: Using LOCAL FILE STORAGE', 'yellow');
    console.log('\n' + '='.repeat(70) + '\n');
  }
}

// Run check
checkS3Bucket().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
