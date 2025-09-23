const express = require('express');
const router = express.Router();

// Generate AI questions for coding solutions
router.post('/generate-questions', async (req, res) => {
  try {
    const { question, code, type } = req.body;

    if (!question || !code) {
      return res.status(400).json({
        success: false,
        error: 'Question and code are required'
      });
    }

    // Prepare the prompt for OpenRouter
    const systemPrompt = `You are an AI coding interviewer. After a candidate submits their code solution, you need to ask 3 follow-up questions to evaluate their understanding and approach.

Your questions should:
1. Test their understanding of the solution
2. Ask about time/space complexity
3. Explore edge cases or alternative approaches

Be professional, specific, and challenging but fair.`;

    const userPrompt = `Coding Question: "${question}"

Candidate's Code:
\`\`\`javascript
${code}
\`\`\`

Generate exactly 3 follow-up questions that an interviewer would ask about this code. Return them as a JSON array of strings.`;

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
        'X-Title': 'AI Interview System'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
    }

    const openRouterData = await openRouterResponse.json();
    const aiResponse = openRouterData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to parse the JSON response
    let questions;
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      // If parsing fails, create fallback questions
      questions = [
        "Can you explain your approach to solving this problem?",
        "What is the time complexity of your solution?",
        "How would you handle edge cases in your code?"
      ];
    }

    // Ensure we have exactly 3 questions
    if (!Array.isArray(questions) || questions.length !== 3) {
      questions = [
        "Can you explain your approach to solving this problem?",
        "What is the time complexity of your solution?",
        "How would you handle edge cases in your code?"
      ];
    }

    res.json({
      success: true,
      data: {
        questions: questions,
        originalResponse: aiResponse
      }
    });

  } catch (error) {
    console.error('Error generating AI questions:', error);
    
    // Return fallback questions
    res.json({
      success: true,
      data: {
        questions: [
          "Can you explain your approach to solving this problem?",
          "What is the time complexity of your solution?",
          "How would you handle edge cases in your code?"
        ],
        error: error.message
      }
    });
  }
});

module.exports = router;