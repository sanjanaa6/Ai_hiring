const mongoose = require('mongoose');
const Interview = require('../models/Interview');

async function checkQuestions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-hiring');
    console.log('Connected to MongoDB\n');
    
    const interview = await Interview.findOne({'rounds.type': 'system_design'});
    
    if (!interview) {
      console.log('No system design interview found');
      process.exit(0);
    }
    
    const systemDesignRound = interview.rounds.find(r => r.type === 'system_design');
    
    console.log('Interview Title:', interview.title);
    console.log('Round Title:', systemDesignRound.title);
    console.log('Total Questions:', systemDesignRound.questions.length);
    console.log('\nQuestions:');
    
    systemDesignRound.questions.forEach((q, i) => {
      console.log(`\n${i + 1}. ${q.question || q.text}`);
      console.log(`   ID: ${q.id}`);
      console.log(`   Type: ${q.type}`);
      if (q.followUpQuestions && q.followUpQuestions.length > 0) {
        console.log(`   Follow-up questions: ${q.followUpQuestions.length}`);
        q.followUpQuestions.forEach((fq, j) => {
          console.log(`      ${j + 1}. ${fq}`);
        });
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkQuestions();
