const mongoose = require('mongoose');
const Interview = require('../models/Interview');

// Database migration script to add allowRetake field to existing rounds
const migrateAllowRetake = async () => {
  try {
    console.log('🔄 Starting allowRetake migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_hiring', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all interviews
    const interviews = await Interview.find({});
    console.log(`📊 Found ${interviews.length} interviews to migrate`);
    
    let updatedCount = 0;
    
    for (const interview of interviews) {
      let needsUpdate = false;
      
      if (interview.rounds && interview.rounds.length > 0) {
        for (const round of interview.rounds) {
          // If allowRetake field doesn't exist, add it with default value false
          if (round.allowRetake === undefined) {
            round.allowRetake = false;
            needsUpdate = true;
            console.log(`🔧 Adding allowRetake: false to round "${round.title}" in interview "${interview.title}"`);
          }
        }
        
        if (needsUpdate) {
          await interview.save();
          updatedCount++;
          console.log(`✅ Updated interview: ${interview.title}`);
        }
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} interviews`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateAllowRetake();
}

module.exports = migrateAllowRetake;
