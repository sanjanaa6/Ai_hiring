// Interview utility functions
const axios = require('axios');

// API Configuration
const OPENROUTER_API_URL = (process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1') + '/chat/completions';

// Fallback models in order of preference
const FALLBACK_MODELS = [
  'openai/gpt-3.5-turbo',
  'openai/gpt-4',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3-sonnet',
  'google/gemini-pro',
  'meta-llama/llama-2-70b-chat',
  'mistralai/mistral-7b-instruct'
];

// Validation function for interview structure
const validateInterviewStructure = (interviewData) => {
  try {
    if (!interviewData) {
      console.log('❌ [VALIDATION] Interview data is null or undefined');
      return false;
    }

    if (!interviewData.interviewId || !interviewData.title) {
      console.log('❌ [VALIDATION] Missing required fields (interviewId or title)');
      return false;
    }

    if (!interviewData.rounds || !Array.isArray(interviewData.rounds)) {
      console.log('❌ [VALIDATION] Rounds is missing or not an array');
      return false;
    }

    if (interviewData.rounds.length === 0) {
      console.log('❌ [VALIDATION] No rounds found');
      return false;
    }

    // Check that each round has at least one question
    for (let i = 0; i < interviewData.rounds.length; i++) {
      const round = interviewData.rounds[i];
      if (!round.questions || !Array.isArray(round.questions) || round.questions.length === 0) {
        console.log(`❌ [VALIDATION] Round ${i + 1} has no questions`);
        return false;
      }
    }

    console.log('✅ [VALIDATION] Interview structure is valid');
    return true;
  } catch (error) {
    console.log('❌ [VALIDATION] Error during validation:', error.message);
    return false;
  }
};

// Helper function to validate JSON structure
const validateJSONStructure = (jsonText) => {
  try {
    // Check for basic JSON structure
    if (!jsonText.includes('{') || !jsonText.includes('}')) {
      return false;
    }
    
    // Check for balanced braces and brackets
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonText.length; i++) {
      const char = jsonText[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
      }
    }
    
    return braceCount === 0 && bracketCount === 0;
  } catch (error) {
    return false;
  }
};

// Helper function to parse AI response
const parseAIResponse = (responseText) => {
  try {
    // Validate responseText input
    if (!responseText || typeof responseText !== 'string') {
      console.log('⚠️ [PARSE AI RESPONSE] Invalid responseText provided:', responseText);
      return null;
    }
    
    console.log('🔍 [PARSE AI RESPONSE] Raw response text length:', responseText.length);
    
    // Try to find and extract JSON from the response
    let jsonText = responseText;
    
    // Look for JSON object boundaries
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = responseText.substring(jsonStart, jsonEnd + 1);
      console.log('🔍 [PARSE AI RESPONSE] Extracted JSON text length:', jsonText.length);
    }
    
    // More aggressive JSON cleaning
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\n/g, ' ')     // Replace newlines with spaces
      .replace(/\r/g, ' ')     // Replace carriage returns with spaces
      .replace(/\t/g, ' ')     // Replace tabs with spaces
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .replace(/\\"/g, '"')    // Fix escaped quotes
      .replace(/\\'/g, "'")    // Fix escaped single quotes
      .replace(/\\n/g, ' ')    // Replace escaped newlines
      .replace(/\\r/g, ' ')    // Replace escaped carriage returns
      .replace(/\\t/g, ' ')    // Replace escaped tabs
      .trim();
    
    console.log('🔍 [PARSE AI RESPONSE] Cleaned JSON text:', jsonText.substring(0, 200) + '...');
    
    // Validate JSON structure before parsing
    if (!validateJSONStructure(jsonText)) {
      console.log('⚠️ [PARSE AI RESPONSE] JSON structure validation failed, trying alternative methods...');
      throw new Error('Invalid JSON structure');
    }
    
    // Try to parse the cleaned JSON
    let parsed = JSON.parse(jsonText);
    console.log('✅ [PARSE AI RESPONSE] Successfully parsed JSON');
    return parsed;
    
  } catch (error) {
    console.error('❌ [PARSE AI RESPONSE] Error parsing AI response:', error.message);
    console.error('🔍 [PARSE AI RESPONSE] Error at position:', error.message.match(/position (\d+)/)?.[1]);
    
    // Try to find the problematic area
    if (error.message.includes('position')) {
      const position = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
      const start = Math.max(0, position - 100);
      const end = Math.min(responseText.length, position + 100);
      console.error('🔍 [PARSE AI RESPONSE] Problematic area:', responseText.substring(start, end));
    }
    
    // Try alternative parsing methods
    try {
      console.log('🔄 [PARSE AI RESPONSE] Trying alternative parsing methods...');
      
      // Method 1: Try to extract JSON from markdown code blocks first
      const markdownMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      let fixedJson = markdownMatch ? markdownMatch[1] : responseText;
      
      // Method 2: Try to fix common JSON issues more aggressively
      fixedJson = fixedJson
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\r/g, ' ')     // Replace carriage returns with spaces
        .replace(/\t/g, ' ')     // Replace tabs with spaces
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .replace(/\\"/g, '"')    // Fix escaped quotes
        .replace(/\\'/g, "'")    // Fix escaped single quotes
        .replace(/\\n/g, ' ')    // Replace escaped newlines
        .replace(/\\r/g, ' ')    // Replace escaped carriage returns
        .replace(/\\t/g, ' ')    // Replace escaped tabs
        .replace(/[^\x20-\x7E]/g, ' ') // Remove non-printable characters
        .trim();
      
      // Try to find JSON boundaries again
      const jsonStart = fixedJson.indexOf('{');
      const jsonEnd = fixedJson.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        fixedJson = fixedJson.substring(jsonStart, jsonEnd + 1);
      }
      
      // Method 3: Try to fix truncated JSON by finding the last complete object/array
      try {
        // Find the last complete round object
        const roundsMatch = fixedJson.match(/"rounds":\s*\[([\s\S]*?)(?=\]|$)/);
        if (roundsMatch) {
          let roundsContent = roundsMatch[1];
          // Try to find complete round objects
          const roundMatches = roundsContent.match(/\{[^{}]*"roundId"[^{}]*\}/g);
          if (roundMatches && roundMatches.length > 0) {
            // Reconstruct the JSON with complete rounds
            const completeRounds = '[' + roundMatches.join(',') + ']';
            fixedJson = fixedJson.replace(/"rounds":\s*\[[\s\S]*?\]/, `"rounds":${completeRounds}`);
          }
        }
      } catch (roundFixError) {
        console.log('⚠️ [PARSE AI RESPONSE] Round fixing failed, continuing with original JSON');
      }
      
      // Try to fix incomplete JSON by adding missing closing brackets
      let openBraces = (fixedJson.match(/\{/g) || []).length;
      let closeBraces = (fixedJson.match(/\}/g) || []).length;
      let openBrackets = (fixedJson.match(/\[/g) || []).length;
      let closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Add missing closing brackets
      while (openBraces > closeBraces) {
        fixedJson += '}';
        closeBraces++;
      }
      while (openBrackets > closeBrackets) {
        fixedJson += ']';
        closeBrackets++;
      }
      
      console.log('🔍 [PARSE AI RESPONSE] Fixed JSON length:', fixedJson.length);
      console.log('🔍 [PARSE AI RESPONSE] Fixed JSON preview:', fixedJson.substring(0, 200) + '...');
      
      // Validate the fixed JSON structure
      if (!validateJSONStructure(fixedJson)) {
        console.log('⚠️ [PARSE AI RESPONSE] Fixed JSON structure validation failed');
        throw new Error('Fixed JSON structure is still invalid');
      }
      
      const parsed = JSON.parse(fixedJson);
      console.log('✅ [PARSE AI RESPONSE] Successfully parsed fixed JSON');
      return parsed;
      
    } catch (secondError) {
      console.error('❌ [PARSE AI RESPONSE] Alternative parsing also failed:', secondError.message);
      
      // Method 2: Try to extract just the essential parts
      try {
        console.log('🔄 [PARSE AI RESPONSE] Trying to extract essential parts...');
        
        // Try to find interviewId and title at least
        const interviewIdMatch = responseText.match(/"interviewId":\s*"([^"]+)"/);
        const titleMatch = responseText.match(/"title":\s*"([^"]+)"/);
        
        if (interviewIdMatch && titleMatch) {
          console.log('✅ [PARSE AI RESPONSE] Found essential parts, creating minimal structure');
          
          // Try to extract any rounds that might be partially parsed
          const roundsMatch = responseText.match(/"rounds":\s*\[([\s\S]*?)\]/);
          let rounds = [];
          
          if (roundsMatch) {
            try {
              // Try to parse the rounds array
              const roundsArray = JSON.parse('[' + roundsMatch[1] + ']');
              if (Array.isArray(roundsArray)) {
                rounds = roundsArray;
                console.log('✅ [PARSE AI RESPONSE] Successfully extracted rounds:', rounds.length);
              }
            } catch (roundsError) {
              console.log('⚠️ [PARSE AI RESPONSE] Could not parse rounds array, creating default rounds');
              // Create default rounds if parsing fails
              for (let i = 1; i <= 3; i++) {
                rounds.push({
                  roundId: `round_${i}`,
                  roundNumber: i,
                  title: `Round ${i}`,
                  description: `Interview round ${i}`,
                  duration: 20,
                  evaluationCriteria: {
                    technical: "Technical knowledge assessment",
                    practical: "Practical skills evaluation"
                  },
                  questions: []
                });
                
                // Add 3 questions to each round
                for (let j = 1; j <= 3; j++) {
                  rounds[i-1].questions.push({
                    id: `q${i}_${j}`,
                    type: "technical",
                    question: `AI-generated question ${j} for round ${i}`,
                    expectedAnswer: "Look for relevant technical knowledge and practical experience",
                    timeLimit: 3,
                    difficulty: "medium",
                    followUpQuestions: []
                  });
                }
              }
            }
          } else {
            // Create default rounds if no rounds found
            for (let i = 1; i <= 3; i++) {
              rounds.push({
                roundId: `round_${i}`,
                roundNumber: i,
                title: `Round ${i}`,
                description: `Interview round ${i}`,
                duration: 20,
                evaluationCriteria: {
                  technical: "Technical knowledge assessment",
                  practical: "Practical skills evaluation"
                },
                questions: []
              });
              
              // Add 3 questions to each round
              for (let j = 1; j <= 3; j++) {
                rounds[i-1].questions.push({
                  id: `q${i}_${j}`,
                  type: "technical",
                  question: `AI-generated question ${j} for round ${i}`,
                  expectedAnswer: "Look for relevant technical knowledge and practical experience",
                  timeLimit: 3,
                  difficulty: "medium",
                  followUpQuestions: []
                });
              }
            }
          }
          
          return {
            interviewId: interviewIdMatch[1],
            title: titleMatch[1],
            totalDuration: 90,
            rounds: rounds,
            overallEvaluationCriteria: {
              technical: "Technical knowledge and problem-solving skills",
              communication: "Communication and presentation skills",
              experience: "Relevant work experience and achievements"
            },
            scoringSystem: {
              excellent: 5,
              good: 4,
              average: 3,
              belowAverage: 2,
              poor: 1
            },
            company: "Your Company"
          };
        }
      } catch (thirdError) {
        console.error('❌ [PARSE AI RESPONSE] Essential parts extraction failed:', thirdError.message);
      }
    }
    
    return null;
  }
};

// Helper function to extract job details from prompt
const extractJobDetailsFromPrompt = (prompt) => {
  try {
    console.log('🔍 [EXTRACT JOB DETAILS] Extracting from prompt...');
    
    // Validate prompt input
    if (!prompt || typeof prompt !== 'string') {
      console.log('⚠️ [EXTRACT JOB DETAILS] Invalid prompt provided:', prompt);
      return {
        title: 'Generic Role',
        company: 'Your Company',
        description: 'No description available',
        requirements: 'No requirements available',
        level: 'Mid-level'
      };
    }
    
    // Extract job title from prompt
    let title = 'Generic Role';
    const titleMatch = prompt.match(/(?:for this job|for a|for an|for the)\s*:?\s*([^:\n]+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // Try to find role-specific keywords
      const promptLower = prompt.toLowerCase();
      if (promptLower.includes('sales')) {
        title = 'Sales Representative';
      } else if (promptLower.includes('developer')) {
        title = 'Software Developer';
      } else if (promptLower.includes('engineer')) {
        title = 'Software Engineer';
      } else if (promptLower.includes('manager')) {
        title = 'Manager';
      } else if (promptLower.includes('analyst')) {
        title = 'Business Analyst';
      }
    }
    
    const jobDetails = {
      title: title,
      company: 'Your Company',
      description: prompt.length > 500 ? prompt.substring(0, 500) + '...' : prompt,
      requirements: prompt.length > 300 ? prompt.substring(0, 300) + '...' : prompt,
      level: 'Mid-level'
    };
    
    console.log('✅ [EXTRACT JOB DETAILS] Extracted:', jobDetails);
    return jobDetails;
  } catch (error) {
    console.error('❌ [EXTRACT JOB DETAILS] Error extracting job details:', error);
    return {
      title: 'Generic Role',
      company: 'Your Company',
      description: 'No description available',
      requirements: 'No requirements available',
      level: 'Mid-level'
    };
  }
};

// Helper function to generate candidate performance summaries
const getCandidateSummaries = (candidateAnswers) => {
  const candidateMap = new Map();
  
  candidateAnswers.forEach(answer => {
    const candidateId = answer.candidateId;
    
    if (!candidateMap.has(candidateId)) {
      candidateMap.set(candidateId, {
        candidateId: answer.candidateId,
        candidateName: answer.candidateName,
        candidateEmail: answer.candidateEmail,
        totalAnswers: 0,
        totalScore: 0,
        averageScore: 0,
        roundsCompleted: new Set(),
        answers: [],
        strengths: [],
        improvements: [],
        lastActivity: answer.timestamp
      });
    }
    
    const candidate = candidateMap.get(candidateId);
    candidate.totalAnswers++;
    candidate.totalScore += answer.aiEvaluation?.score || 0;
    candidate.roundsCompleted.add(answer.roundId);
    candidate.answers.push({
      roundId: answer.roundId,
      questionId: answer.questionId,
      question: answer.question,
      answer: answer.answer,
      score: answer.aiEvaluation?.score || 0,
      feedback: answer.aiEvaluation?.feedback || '',
      timeTaken: answer.timeTaken,
      timestamp: answer.timestamp
    });
    
    if (answer.aiEvaluation?.strengths) {
      candidate.strengths.push(...answer.aiEvaluation.strengths);
    }
    if (answer.aiEvaluation?.improvements) {
      candidate.improvements.push(...answer.aiEvaluation.improvements);
    }
    
    if (answer.timestamp > candidate.lastActivity) {
      candidate.lastActivity = answer.timestamp;
    }
  });
  
  // Calculate averages and convert to array
  return Array.from(candidateMap.values()).map(candidate => {
    candidate.averageScore = candidate.totalAnswers > 0 ? 
      (candidate.totalScore / candidate.totalAnswers) : 0;
    candidate.roundsCompleted = Array.from(candidate.roundsCompleted);
    candidate.completionRate = candidate.roundsCompleted.length;
    
    // Get unique strengths and improvements
    candidate.strengths = [...new Set(candidate.strengths)];
    candidate.improvements = [...new Set(candidate.improvements)];
    
    return candidate;
  }).sort((a, b) => b.averageScore - a.averageScore); // Sort by highest score first
};

module.exports = {
  OPENROUTER_API_URL,
  FALLBACK_MODELS,
  validateInterviewStructure,
  validateJSONStructure,
  parseAIResponse,
  extractJobDetailsFromPrompt,
  getCandidateSummaries
};
