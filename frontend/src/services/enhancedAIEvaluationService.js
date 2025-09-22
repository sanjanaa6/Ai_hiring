import axios from 'axios';

class EnhancedAIEvaluationService {
  constructor() {
    this.baseURL = '/api/ai';
  }

  // Enhanced scoring criteria with detailed breakdowns
  getScoringCriteria() {
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
  }

  // Calculate detailed scores for each question
  calculateQuestionScores(question, answer, context = {}) {
    const criteria = this.getScoringCriteria();
    const scores = {};

    // Analyze answer using AI
    const analysis = this.analyzeAnswer(question, answer, context);

    // Calculate scores for each main category
    Object.keys(criteria).forEach(category => {
      scores[category] = this.calculateCategoryScore(
        category, 
        criteria[category], 
        analysis, 
        question, 
        answer
      );
    });

    return {
      scores,
      analysis,
      breakdown: this.generateScoreBreakdown(scores, criteria)
    };
  }

  // Calculate category score based on subcategories
  calculateCategoryScore(category, categoryCriteria, analysis, question, answer) {
    let totalScore = 0;
    const subcategoryScores = {};

    Object.keys(categoryCriteria.subcategories).forEach(subcategory => {
      const subcategoryWeight = categoryCriteria.subcategories[subcategory].weight;
      const subcategoryScore = this.evaluateSubcategory(
        subcategory, 
        category, 
        analysis, 
        question, 
        answer
      );
      
      subcategoryScores[subcategory] = subcategoryScore;
      totalScore += subcategoryScore * subcategoryWeight;
    });

    return {
      overall: Math.round(totalScore * 10) / 10,
      subcategories: subcategoryScores,
      weight: categoryCriteria.weight
    };
  }

  // Enhanced evaluation with detailed scoring
  async evaluateInterview(interviewData) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${this.baseURL}/evaluate-interview`, {
        interviewData,
        scoringCriteria: this.getScoringCriteria()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error evaluating interview:', error);
      throw error;
    }
  }
}

export default new EnhancedAIEvaluationService();