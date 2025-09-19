import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat-v3.1:free';

class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
    this.client = axios.create({
      baseURL: OPENROUTER_API_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Hiring Platform'
      }
    });
  }

  async generateResponse(prompt, context = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await this.client.post('', {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9
      });

      return {
        success: true,
        data: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  buildSystemPrompt(context) {
    const { userRole = 'recruiter', companyInfo = {} } = context;
    
    let systemPrompt = `You are an AI assistant for an AI-powered hiring platform. You help ${userRole}s with various tasks related to recruitment and job management.`;
    
    if (userRole === 'recruiter') {
      systemPrompt += `\n\nAs a recruiter assistant, you can help with:
      - Job description optimization
      - Candidate screening questions
      - Interview preparation
      - Hiring strategy advice
      - Market insights
      - Salary benchmarking
      - Skills assessment
      
      Be professional, helpful, and provide actionable insights.`;
    } else if (userRole === 'candidate') {
      systemPrompt += `\n\nAs a candidate assistant, you can help with:
      - Resume optimization
      - Interview preparation
      - Career advice
      - Skill development
      - Job search strategies
      - Salary negotiation
      
      Be encouraging, supportive, and provide practical guidance.`;
    } else if (userRole === 'admin') {
      systemPrompt += `\n\nAs an admin assistant, you can help with:
      - Platform analytics
      - User management insights
      - System optimization
      - Performance metrics
      - Security recommendations
      
      Be analytical, data-driven, and provide strategic insights.`;
    }

    if (companyInfo.company) {
      systemPrompt += `\n\nCompany context: ${companyInfo.company}`;
      if (companyInfo.industry) {
        systemPrompt += ` in the ${companyInfo.industry} industry`;
      }
    }

    return systemPrompt;
  }

  // Specific AI functions for different use cases
  async optimizeJobDescription(jobTitle, jobDescription, requirements) {
    const prompt = `Please optimize this job description for better candidate attraction and clarity:

Job Title: ${jobTitle}
Current Description: ${jobDescription}
Requirements: ${requirements}

Please provide:
1. An improved job description
2. Key selling points
3. Required vs preferred qualifications
4. Company culture highlights`;

    return await this.generateResponse(prompt, { userRole: 'recruiter' });
  }

  async generateInterviewQuestions(jobTitle, jobDescription, candidateLevel = 'mid') {
    const prompt = `Generate comprehensive interview questions for a ${candidateLevel}-level ${jobTitle} position.

Job Description: ${jobDescription}

Please provide:
1. 5 technical questions
2. 5 behavioral questions
3. 3 situational questions
4. 2 culture fit questions`;

    return await this.generateResponse(prompt, { userRole: 'recruiter' });
  }

  async analyzeCandidateProfile(resume, jobRequirements) {
    const prompt = `Analyze this candidate profile against the job requirements:

Resume Summary: ${resume}
Job Requirements: ${jobRequirements}

Please provide:
1. Match percentage
2. Strengths
3. Potential concerns
4. Interview focus areas
5. Recommendation`;

    return await this.generateResponse(prompt, { userRole: 'recruiter' });
  }

  async getMarketInsights(jobTitle, location) {
    const prompt = `Provide market insights for ${jobTitle} positions in ${location}:

Please include:
1. Average salary range
2. Market demand
3. Key skills in demand
4. Competition level
5. Hiring trends`;

    return await this.generateResponse(prompt, { userRole: 'recruiter' });
  }
}

export default new AIService();
