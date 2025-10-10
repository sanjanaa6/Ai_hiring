import apiService from './apiService';

class ElectronicsInterviewService {
  constructor() {
    this.baseURL = '/api/electronics';
  }

  // Generate electronics interview with PCB round
  async generateElectronicsInterview(prompt) {
    try {
      console.log('🔧 [ELECTRONICS INTERVIEW] Generating electronics interview...');
      
      const response = await apiService.post('/electronics/generate-electronics', {
        prompt: prompt
      });

      if (response.success) {
        console.log('✅ [ELECTRONICS INTERVIEW] Interview generated successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate electronics interview');
      }
    } catch (error) {
      console.error('❌ [ELECTRONICS INTERVIEW] Error generating interview:', error);
      throw error;
    }
  }

  // Get electronics interview by ID
  async getElectronicsInterview(interviewId) {
    try {
      console.log('🔍 [ELECTRONICS INTERVIEW] Fetching electronics interview:', interviewId);
      
      const response = await apiService.get(`/electronics/${interviewId}`);

      if (response.success) {
        console.log('✅ [ELECTRONICS INTERVIEW] Interview fetched successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch electronics interview');
      }
    } catch (error) {
      console.error('❌ [ELECTRONICS INTERVIEW] Error fetching interview:', error);
      throw error;
    }
  }

  // Get all electronics interviews for user
  async getElectronicsInterviews() {
    try {
      console.log('📋 [ELECTRONICS INTERVIEW] Fetching electronics interviews...');
      
      const response = await apiService.get('/electronics');

      if (response.success) {
        console.log('✅ [ELECTRONICS INTERVIEW] Interviews fetched successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch electronics interviews');
      }
    } catch (error) {
      console.error('❌ [ELECTRONICS INTERVIEW] Error fetching interviews:', error);
      throw error;
    }
  }

  // Submit PCB design answer
  async submitPCBDesignAnswer(interviewId, roundId, questionId, pcbDesignData) {
    try {
      console.log('🔧 [PCB DESIGN] Submitting PCB design answer...');
      
      const response = await apiService.post(`/electronics/${interviewId}/rounds/${roundId}/questions/${questionId}/pcb-answer`, {
        pcbDesign: pcbDesignData,
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        console.log('✅ [PCB DESIGN] PCB design answer submitted successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to submit PCB design answer');
      }
    } catch (error) {
      console.error('❌ [PCB DESIGN] Error submitting PCB design answer:', error);
      throw error;
    }
  }

  // Check if interview has PCB round
  hasPCBRound(interview) {
    if (!interview || !interview.rounds) return false;
    
    return interview.rounds.some(round => 
      round.questions && round.questions.some(question => 
        question.type === 'pcb-design' || question.pcbDesign?.enabled
      )
    );
  }

  // Get PCB round from interview
  getPCBRound(interview) {
    if (!interview || !interview.rounds) return null;
    
    return interview.rounds.find(round => 
      round.questions && round.questions.some(question => 
        question.type === 'pcb-design' || question.pcbDesign?.enabled
      )
    );
  }

  // Get PCB questions from a round
  getPCBQuestions(round) {
    if (!round || !round.questions) return [];
    
    return round.questions.filter(question => 
      question.type === 'pcb-design' || question.pcbDesign?.enabled
    );
  }

  // Validate PCB design data
  validatePCBDesign(pcbDesignData) {
    const errors = [];
    
    if (!pcbDesignData.components || pcbDesignData.components.length === 0) {
      errors.push('At least one component must be placed on the PCB');
    }
    
    if (!pcbDesignData.designNotes || pcbDesignData.designNotes.trim().length < 10) {
      errors.push('Design notes must be at least 10 characters long');
    }
    
    if (pcbDesignData.timeSpent < 60) {
      errors.push('Design time must be at least 1 minute');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Get electronics interview types
  getElectronicsInterviewTypes() {
    return [
      {
        type: 'electronics_engineer',
        name: 'Electronics Engineer',
        description: 'Circuit design, PCB layout, component selection',
        pcbRequired: true
      },
      {
        type: 'electrical_engineer', 
        name: 'Electrical Engineer',
        description: 'Power systems, electrical design, safety standards',
        pcbRequired: false
      },
      {
        type: 'embedded_engineer',
        name: 'Embedded Engineer', 
        description: 'Firmware development, microcontroller programming',
        pcbRequired: true
      },
      {
        type: 'hardware_engineer',
        name: 'Hardware Engineer',
        description: 'Hardware design, PCB layout, testing',
        pcbRequired: true
      }
    ];
  }

  // Generate electronics interview prompt template
  generateElectronicsPromptTemplate(jobTitle, company, requirements) {
    return `Create an electronics interview for the following position:

Job Title: ${jobTitle}
Company: ${company}
Requirements: ${requirements}

Please generate a comprehensive interview that includes:
1. Electronics fundamentals and theory
2. Component knowledge and selection
3. Circuit design and analysis
4. PCB design and layout (mandatory round)
5. Testing and troubleshooting
6. Project experience and problem solving

The interview should be practical and hands-on, with real-world scenarios and challenges.`;
  }
}

const electronicsInterviewService = new ElectronicsInterviewService();
export default electronicsInterviewService;
