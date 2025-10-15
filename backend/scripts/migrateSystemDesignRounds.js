/**
 * Migration Script: Convert Round 3 to system_design type for Developer Interviews
 * 
 * This script updates existing developer interviews in the database to convert
 * Round 3 (System Design & Architecture) from 'interview' type to 'system_design' type.
 * 
 * Usage: node scripts/migrateSystemDesignRounds.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Interview model
const Interview = require('../models/Interview');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

async function migrateSystemDesignRounds() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { family: 4 });
    console.log('✅ Connected to MongoDB\n');

    // Find all interviews
    const interviews = await Interview.find({});
    console.log(`📊 Found ${interviews.length} total interviews\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const interview of interviews) {
      // Check if this is a developer interview
      const isDeveloperInterview = 
        interview.jobTitle?.toLowerCase().includes('developer') ||
        interview.jobTitle?.toLowerCase().includes('engineer') ||
        interview.jobTitle?.toLowerCase().includes('programmer') ||
        interview.title?.toLowerCase().includes('developer') ||
        interview.title?.toLowerCase().includes('engineer');

      if (!isDeveloperInterview) {
        console.log(`⏭️  Skipping non-developer interview: ${interview.title}`);
        skippedCount++;
        continue;
      }

      // Check if Round 3 exists and is a System Design round
      if (interview.rounds && interview.rounds.length >= 3) {
        const round3 = interview.rounds[2]; // Index 2 is Round 3

        // Check if it's a System Design round
        const isSystemDesignRound = 
          round3.title?.toLowerCase().includes('system design') ||
          round3.title?.toLowerCase().includes('architecture');

        if (isSystemDesignRound && round3.type !== 'system_design') {
          console.log(`\n🔄 Updating interview: ${interview.title}`);
          console.log(`   Interview ID: ${interview.interviewId}`);
          console.log(`   Round 3: ${round3.title}`);
          console.log(`   Current type: ${round3.type || 'interview'}`);

          // Update Round 3 to system_design type
          round3.type = 'system_design';

          // Keep only the first question as the design problem
          if (round3.questions && round3.questions.length > 1) {
            console.log(`   Reducing questions from ${round3.questions.length} to 1`);
            round3.questions = [round3.questions[0]];
          }

          // Save the updated interview
          await interview.save();
          updatedCount++;
          console.log(`   ✅ Updated to system_design type`);
        } else if (round3.type === 'system_design') {
          console.log(`✓ Interview already has system_design type: ${interview.title}`);
          skippedCount++;
        } else {
          console.log(`⏭️  Round 3 is not a System Design round: ${interview.title} - ${round3.title}`);
          skippedCount++;
        }
      } else {
        console.log(`⏭️  Interview has less than 3 rounds: ${interview.title}`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total interviews processed: ${interviews.length}`);
    console.log(`✅ Updated to system_design: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log('='.repeat(60));

    if (updatedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('📝 Note: Restart your backend server to see the changes.');
    } else {
      console.log('\n✓ No interviews needed migration.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
console.log('🚀 Starting System Design Round Migration...\n');
migrateSystemDesignRounds();
