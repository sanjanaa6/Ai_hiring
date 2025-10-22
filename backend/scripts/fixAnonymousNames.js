const mongoose = require('mongoose');
const InterviewRecording = require('../models/InterviewRecording');
require('dotenv').config();

/**
 * Script to fix anonymous candidate names in recordings
 * Changes "Anonymous_USERID" to "Anonymous Candidate"
 */
async function fixAnonymousNames() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring');
    console.log('✅ Connected to MongoDB');

    // Find all recordings with Anonymous_ pattern in candidateName
    const recordings = await InterviewRecording.find({
      candidateName: /^Anonymous_\d+$/
    });

    console.log(`📋 Found ${recordings.length} recordings with Anonymous_USERID format`);

    if (recordings.length === 0) {
      console.log('✅ No recordings to fix!');
      process.exit(0);
    }

    let updated = 0;
    for (const recording of recordings) {
      const oldName = recording.candidateName;
      // Extract the number from Anonymous_176076148721
      const userId = oldName.replace('Anonymous_', '');
      // Create a friendly name
      const newName = `Anonymous Candidate #${userId.slice(-4)}`; // Use last 4 digits
      
      recording.candidateName = newName;
      await recording.save();
      
      console.log(`✅ Updated: ${oldName} → ${newName}`);
      updated++;
    }

    console.log(`\n🎉 Successfully updated ${updated} recordings!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAnonymousNames();
