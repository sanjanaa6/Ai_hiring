const express = require('express');
const axios = require('axios');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-3.5-turbo';

// Enhanced scoring criteria
const getScoringCriteria = () => {
  return {
    technical: {
      weight: 0.25,
      subcategories: {
        knowledge: { weight: 0.4, description: 'Depth of technical knowledge' },
        application: { weight: 0.3, description: 'Ability to apply knowledge practically' },
        problemSolving: { weight: 0.2, description: 'Technical problem-solving approach' },
        innovation: { weight: 0.1, description: 'Creative technical solutions' }
      }
    },
    communication: {
      weight: 0.20,
      subcategories: {
        clarity: { weight: 0.4, description: 'Clear and articulate expression' },
        structure: { weight: 0.3, description: 'Well-organized thoughts' },
        listening: { weight: 0.2, description: 'Active listening and understanding' },
        adaptability: { weight: 0.1, description: 'Adapting communication style' }
      }
    },
    problemSolving: {
      weight: 0.20,
      subcategories: {
        approach: { weight: 0.3, description: 'Systematic problem-solving approach' },
        creativity: { weight: 0.25, description: 'Creative thinking and innovation' },
        analysis: { weight: 0.25, description: 'Analytical depth and reasoning' },
        implementation: { weight: 0.2, description: 'Practical implementation skills' }
      }
    },
    engagement: {
      weight: 0.15,
      subcategories: {
        enthusiasm: { weight: 0.4, description: 'Passion and motivation' },
        curiosity: { weight: 0.3, description: 'Asking thoughtful questions' },
        participation: { weight: 0.2, description: 'Active participation' },
        energy: { weight: 0.1, description: 'Positive energy and attitude' }
      }
    },
    culturalFit: {
      weight: 0.10,
      subcategories: {
        values: { weight: 0.4, description: 'Alignment with company values' },
        teamwork: { weight: 0.3, description: 'Collaborative mindset' },
        adaptability: { weight: 0.2, description: 'Adaptability to company culture' },
        leadership: { weight: 0.1, description: 'Leadership potential' }
      }
    },
    responseQuality: {
      weight: 0.10,
      subcategories: {
        completeness: { weight: 0.4, description: 'Complete and thorough answers' },
        relevance: { weight: 0.3, description: 'Relevant to the question asked' },
        depth: { weight: 0.2, description: 'Depth of insight provided' },
        examples: { weight: 0.1, description: 'Use of concrete examples' }
      }
    }
  };
};

// @desc    Enhanced interview evaluation with detailed scoring
// @route   POST /api/ai/evaluate-interview
// @access  Private (Recruiter/Admin)
router.post('/evaluate-interview', auth, authorize(['recruiter', 'admin']), async (req, res) => {
  const { interviewData, scoringCriteria } = req.body;

  if (!interviewData || !interviewData.questions || !interviewData.answers) {
    return res.status(400).json({ 
      success: false, 
      message: 'Interview data with questions and answers is required' 
    });
  }

  try {
    const criteria = scoringCriteria || getScoringCriteria();
    const evaluation = await performEnhancedEvaluation(interviewData, criteria);

    res.status(200).json({
      success: true,
      evaluation
    });

  } catch (error) {
    console.error('❌ [ENHANCED EVALUATION] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to evaluate interview' 
    });
  }
});

// @desc    Analyze individual question response
// @route   POST /api/ai/analyze-question
// @access  Private (Recruiter/Admin)
router.post('/analyze-question', auth, authorize(['recruiter', 'admin']), async (req, res) => {
  const { question, answer, context, scoringCriteria } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ 
      success: false, 
      message: 'Question and answer are required' 
    });
  }

  try {
    const criteria = scoringCriteria || getScoringCriteria();
    const analysis = await analyzeQuestionResponse(question, answer, context, criteria);

    res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ [QUESTION ANALYSIS] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to analyze question response' 
    });
  }
});

// Enhanced evaluation function
async function performEnhancedEvaluation(interviewData, criteria) {
  const { questions, answers, candidateInfo, interviewContext } = interviewData;
  
  // Initialize evaluation structure
  const evaluation = {
    overallScore: 0,
    scores: {},
    subcategoryScores: {},
    questionAnalysis: [],
    detailedFeedback: {},
    strengths: [],
    areasForImprovement: [],
    recommendations: [],
    confidenceLevel: 'medium',
    nextSteps: 'Review detailed analysis'
  };

  // Analyze each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answer = answers[i] || '';
    
    const questionAnalysis = await analyzeQuestionResponse(question, answer, interviewContext, criteria);
    evaluation.questionAnalysis.push(questionAnalysis);
  }

  // Calculate overall scores
  const categoryScores = {};
  const subcategoryScores = {};

  Object.keys(criteria).forEach(category => {
    categoryScores[category] = 0;
    subcategoryScores[category] = {};
    
    Object.keys(criteria[category].subcategories).forEach(subcategory => {
      subcategoryScores[category][subcategory] = 0;
    });
  });

  // Aggregate scores from all questions
  evaluation.questionAnalysis.forEach(questionAnalysis => {
    Object.keys(questionAnalysis.scores).forEach(category => {
      if (categoryScores[category] !== undefined) {
        categoryScores[category] += questionAnalysis.scores[category];
      }
    });

    Object.keys(questionAnalysis.subcategoryScores || {}).forEach(category => {
      Object.keys(questionAnalysis.subcategoryScores[category]).forEach(subcategory => {
        if (subcategoryScores[category] && subcategoryScores[category][subcategory] !== undefined) {
          subcategoryScores[category][subcategory] += questionAnalysis.subcategoryScores[category][subcategory];
        }
      });
    });
  });

  // Calculate averages
  const questionCount = evaluation.questionAnalysis.length;
  Object.keys(categoryScores).forEach(category => {
    evaluation.scores[category] = Math.round((categoryScores[category] / questionCount) * 10) / 10;
  });

  Object.keys(subcategoryScores).forEach(category => {
    evaluation.subcategoryScores[category] = {};
    Object.keys(subcategoryScores[category]).forEach(subcategory => {
      evaluation.subcategoryScores[category][subcategory] = Math.round((subcategoryScores[category][subcategory] / questionCount) * 10) / 10;
    });
  });

  // Calculate weighted overall score
  let weightedScore = 0;
  Object.keys(evaluation.scores).forEach(category => {
    weightedScore += evaluation.scores[category] * criteria[category].weight;
  });
  evaluation.overallScore = Math.round(weightedScore * 10) / 10;

  // Generate detailed feedback
  evaluation.detailedFeedback = await generateDetailedFeedback(evaluation, criteria);
  
  // Generate strengths and areas for improvement
  evaluation.strengths = generateStrengths(evaluation);
  evaluation.areasForImprovement = generateAreasForImprovement(evaluation);
  
  // Generate recommendations
  evaluation.recommendations = generateRecommendations(evaluation, criteria);

  return evaluation;
}

// Analyze individual question response
async function analyzeQuestionResponse(question, answer, context, criteria) {
  try {
    const aiPrompt = `You are an expert interview evaluator. Analyze the following question and answer, then provide detailed scores for each category and subcategory.

Question: "${question}"
Answer: "${answer}"
Context: ${JSON.stringify(context || {})}

Please provide a JSON response with the following structure:
{
  "scores": {
    "technical": 8.5,
    "communication": 7.0,
    "problemSolving": 8.0,
    "engagement": 7.5,
    "culturalFit": 6.5,
    "responseQuality": 7.5
  },
  "subcategoryScores": {
    "technical": {
      "knowledge": 8.5,
      "application": 8.0,
      "problemSolving": 8.5,
      "innovation": 8.0
    },
    "communication": {
      "clarity": 7.5,
      "structure": 6.5,
      "listening": 7.0,
      "adaptability": 7.0
    },
    "problemSolving": {
      "approach": 8.0,
      "creativity": 7.5,
      "analysis": 8.5,
      "implementation": 8.0
    },
    "engagement": {
      "enthusiasm": 8.0,
      "curiosity": 7.0,
      "participation": 7.5,
      "energy": 7.5
    },
    "culturalFit": {
      "values": 6.5,
      "teamwork": 6.0,
      "adaptability": 7.0,
      "leadership": 6.5
    },
    "responseQuality": {
      "completeness": 7.5,
      "relevance": 8.0,
      "depth": 7.0,
      "examples": 7.5
    }
  },
  "feedback": "Detailed feedback about the response quality and areas for improvement"
}

Score each category and subcategory on a scale of 0-10, where:
- 9-10: Excellent/Outstanding
- 7-8: Good/Above Average
- 5-6: Average/Adequate
- 3-4: Below Average/Needs Improvement
- 0-2: Poor/Significant Issues

Consider the question type, answer depth, technical accuracy, communication clarity, and overall response quality.`;

    const response = await axios.post(OPENROUTER_API_URL, {
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'AI Hiring Platform'
      }
    });

    const analysis = JSON.parse(response.data.choices[0].message.content);
    
    return {
      question,
      answer,
      scores: analysis.scores,
      subcategoryScores: analysis.subcategoryScores,
      feedback: analysis.feedback
    };

  } catch (error) {
    console.error('Error analyzing question response:', error);
    
    // Fallback to basic scoring if AI fails
    return {
      question,
      answer,
      scores: {
        technical: 6.0,
        communication: 6.0,
        problemSolving: 6.0,
        engagement: 6.0,
        culturalFit: 6.0,
        responseQuality: 6.0
      },
      subcategoryScores: {},
      feedback: 'Analysis completed with basic scoring due to technical issues.'
    };
  }
}

// Generate detailed feedback
async function generateDetailedFeedback(evaluation, criteria) {
  const feedback = {};
  
  Object.keys(evaluation.scores).forEach(category => {
    const score = evaluation.scores[category];
    const categoryInfo = criteria[category];
    
    if (score >= 8) {
      feedback[category] = `Excellent performance in ${categoryInfo.label.toLowerCase()}. The candidate demonstrates strong capabilities in this area.`;
    } else if (score >= 6) {
      feedback[category] = `Good performance in ${categoryInfo.label.toLowerCase()}. The candidate shows solid understanding with room for growth.`;
    } else if (score >= 4) {
      feedback[category] = `Average performance in ${categoryInfo.label.toLowerCase()}. The candidate needs improvement in this area.`;
    } else {
      feedback[category] = `Below average performance in ${categoryInfo.label.toLowerCase()}. Significant improvement needed.`;
    }
  });
  
  return feedback;
}

// Generate strengths
function generateStrengths(evaluation) {
  const strengths = [];
  
  Object.keys(evaluation.scores).forEach(category => {
    if (evaluation.scores[category] >= 8) {
      strengths.push(`Strong ${category} skills`);
    }
  });
  
  return strengths.length > 0 ? strengths : ['Consistent performance across categories'];
}

// Generate areas for improvement
function generateAreasForImprovement(evaluation) {
  const areas = [];
  
  Object.keys(evaluation.scores).forEach(category => {
    if (evaluation.scores[category] < 6) {
      areas.push(`Improve ${category} skills`);
    }
  });
  
  return areas.length > 0 ? areas : ['Continue developing all skill areas'];
}

// Generate recommendations
function generateRecommendations(evaluation, criteria) {
  const recommendations = [];
  
  Object.keys(evaluation.scores).forEach(category => {
    const score = evaluation.scores[category];
    if (score < 6) {
      recommendations.push({
        category,
        type: 'improvement',
        message: `Focus on improving ${category} skills`,
        priority: score < 4 ? 'high' : 'medium'
      });
    } else if (score >= 8) {
      recommendations.push({
        category,
        type: 'strength',
        message: `Excellent ${category} performance`,
        priority: 'low'
      });
    }
  });
  
  return recommendations;
}

module.exports = router;
