const axios = require('axios');

// Test script for electronics interview system
const BASE_URL = 'http://localhost:5000/api';

async function testElectronicsInterview() {
  console.log('🔧 [TEST] Starting electronics interview system test...');
  
  try {
    // Test 1: Generate electronics interview
    console.log('\n📝 [TEST] Testing electronics interview generation...');
    
    const testPrompt = `Create an electronics interview for a Senior Electronics Engineer position.

Job Title: Senior Electronics Engineer
Company: TechCorp Electronics
Requirements: 
- 5+ years experience in electronics design
- Proficiency in PCB design tools (Altium, KiCad)
- Experience with analog and digital circuit design
- Knowledge of embedded systems and microcontrollers
- Strong problem-solving and troubleshooting skills

The interview should include hands-on PCB design challenges and practical electronics problems.`;

    const generateResponse = await axios.post(`${BASE_URL}/electronics/generate-electronics`, {
      prompt: testPrompt
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // You'll need to replace with actual token
        'Content-Type': 'application/json'
      }
    });

    if (generateResponse.data.success) {
      console.log('✅ [TEST] Electronics interview generated successfully');
      console.log('📊 [TEST] Interview details:', {
        id: generateResponse.data.data.interviewId,
        title: generateResponse.data.data.title,
        duration: generateResponse.data.data.totalDuration,
        rounds: generateResponse.data.data.rounds?.length || 0,
        pcbRoundIncluded: generateResponse.data.data.pcbRoundIncluded
      });
      
      const interviewId = generateResponse.data.data.interviewId;
      
      // Test 2: Get electronics interview
      console.log('\n🔍 [TEST] Testing electronics interview retrieval...');
      
      const getResponse = await axios.get(`${BASE_URL}/electronics/${interviewId}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      if (getResponse.data.success) {
        console.log('✅ [TEST] Electronics interview retrieved successfully');
        
        // Check if PCB round exists
        const hasPCBRound = getResponse.data.data.rounds?.some(round => 
          round.questions?.some(question => 
            question.type === 'pcb-design' || question.pcbDesign?.enabled
          )
        );
        
        console.log('🔧 [TEST] PCB Round included:', hasPCBRound);
        
        if (hasPCBRound) {
          console.log('✅ [TEST] PCB design round found in interview');
          
          // Find PCB questions
          const pcbQuestions = getResponse.data.data.rounds
            .flatMap(round => round.questions || [])
            .filter(question => question.type === 'pcb-design' || question.pcbDesign?.enabled);
          
          console.log('📋 [TEST] PCB questions found:', pcbQuestions.length);
          
          pcbQuestions.forEach((question, index) => {
            console.log(`🔧 [TEST] PCB Question ${index + 1}:`, {
              id: question.id,
              type: question.type,
              hasPCBDesign: !!question.pcbDesign,
              components: question.pcbDesign?.components || [],
              constraints: question.pcbDesign?.constraints || 'No constraints'
            });
          });
        } else {
          console.log('⚠️ [TEST] No PCB round found in interview');
        }
      } else {
        console.log('❌ [TEST] Failed to retrieve electronics interview');
      }
      
    } else {
      console.log('❌ [TEST] Failed to generate electronics interview');
      console.log('Error:', generateResponse.data.error);
    }

  } catch (error) {
    console.error('❌ [TEST] Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test electronics interview types
function testElectronicsTypes() {
  console.log('\n🔧 [TEST] Testing electronics interview types...');
  
  const types = [
    'electronics_engineer',
    'electrical_engineer', 
    'embedded_engineer',
    'hardware_engineer'
  ];
  
  types.forEach(type => {
    console.log(`📋 [TEST] Type: ${type}`);
  });
}

// Run tests
async function runTests() {
  console.log('🚀 [TEST] Starting Electronics Interview System Tests');
  console.log('=' .repeat(60));
  
  testElectronicsTypes();
  await testElectronicsInterview();
  
  console.log('\n✅ [TEST] All tests completed');
  console.log('=' .repeat(60));
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testElectronicsInterview,
  testElectronicsTypes,
  runTests
};
