const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const { parseAIResponse, validateInterviewStructure } = require('../utils/interviewUtils');
const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-3.5-turbo';
const FALLBACK_MODELS = [
  'openai/gpt-3.5-turbo',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemini-pro',
  'anthropic/claude-3-haiku',
  'microsoft/wizardlm-2-8x22b',
  'meta-llama/llama-3.1-70b-instruct'
];

// Helper functions for electronics interview generation
function detectElectronicsRole(jobDescription) {
  const description = jobDescription.toLowerCase();
  
  const electronicsPatterns = [
    { role: 'electronics_engineer', patterns: [
      { keywords: ['electronics', 'electronic', 'circuit', 'pcb', 'pcb design', 'hardware'], weight: 3 },
      { keywords: ['embedded', 'microcontroller', 'arduino', 'raspberry pi'], weight: 2 },
      { keywords: ['analog', 'digital', 'signal processing'], weight: 2 }
    ]},
    { role: 'electrical_engineer', patterns: [
      { keywords: ['electrical', 'power', 'voltage', 'current', 'resistance'], weight: 3 },
      { keywords: ['transformer', 'motor', 'generator', 'power system'], weight: 2 }
    ]},
    { role: 'embedded_engineer', patterns: [
      { keywords: ['embedded', 'firmware', 'microcontroller', 'microprocessor'], weight: 3 },
      { keywords: ['c programming', 'assembly', 'rtos', 'real-time'], weight: 2 }
    ]},
    { role: 'hardware_engineer', patterns: [
      { keywords: ['hardware', 'pcb', 'schematic', 'layout', 'component'], weight: 3 },
      { keywords: ['design', 'manufacturing', 'testing', 'validation'], weight: 2 }
    ]}
  ];
  
  let bestMatch = { role: 'electronics_engineer', score: 0 };
  
  for (const { role, patterns } of electronicsPatterns) {
    let score = 0;
    for (const { keywords, weight } of patterns) {
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
          score += weight;
        }
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { role, score };
    }
  }
  
  console.log(`🎯 [ELECTRONICS ROLE DETECTION] Detected: ${bestMatch.role} (score: ${bestMatch.score})`);
  return bestMatch.role;
}

function getElectronicsRoleConfig(jobTitle, detectedRole) {
  const title = jobTitle.toLowerCase();
  
  const roleConfigs = {
    electronics_engineer: {
      role: 'electronics_engineer',
      focus: 'Circuit design, PCB layout, component selection, signal integrity, power management',
      tools: ['Altium Designer', 'KiCad', 'Multisim', 'Oscilloscope', 'Multimeter', 'Soldering'],
      challenges: ['Circuit analysis', 'PCB design', 'Component selection', 'Troubleshooting', 'Signal integrity'],
      pcbRequired: true
    },
    electrical_engineer: {
      role: 'electrical_engineer',
      focus: 'Power systems, electrical design, safety standards, energy efficiency',
      tools: ['AutoCAD Electrical', 'ETAP', 'PowerWorld', 'Multimeter', 'Clamp meter'],
      challenges: ['Power system design', 'Electrical safety', 'Energy efficiency', 'Load calculations'],
      pcbRequired: false
    },
    embedded_engineer: {
      role: 'embedded_engineer',
      focus: 'Firmware development, microcontroller programming, real-time systems, IoT',
      tools: ['C/C++', 'Arduino IDE', 'STM32', 'Raspberry Pi', 'Debugger', 'Logic analyzer'],
      challenges: ['Firmware development', 'Real-time programming', 'Hardware-software integration', 'Debugging'],
      pcbRequired: true
    },
    hardware_engineer: {
      role: 'hardware_engineer',
      focus: 'Hardware design, PCB layout, component selection, testing, manufacturing',
      tools: ['Altium Designer', 'KiCad', 'Cadence', 'Oscilloscope', 'Spectrum analyzer'],
      challenges: ['Hardware design', 'PCB layout', 'Component selection', 'Testing and validation'],
      pcbRequired: true
    }
  };
  
  return roleConfigs[detectedRole] || roleConfigs.electronics_engineer;
}

function generateElectronicsInterviewPrompt(jobDetails, roleConfig) {
  const { title, description, requirements, level, duration } = jobDetails;
  const { role, focus, tools, challenges, pcbRequired } = roleConfig;
  
  const pcbRoundPrompt = pcbRequired ? `
ROUND 4: PCB Design & Circuit Analysis (25-30 minutes) - MANDATORY FOR ELECTRONICS ROLES
- 5 hands-on PCB design and circuit analysis questions
- MUST include interactive PCB design challenges using the PCB interface
- Questions should cover: schematic design, component selection, PCB layout, signal integrity, power distribution
- Include practical circuit analysis problems
- Test knowledge of PCB manufacturing processes and design rules
- Assess ability to use PCB design tools and understand component specifications
- Include questions about component placement, routing, and design for manufacturability
- Evaluate understanding of electrical safety and EMC considerations
- Test knowledge of different PCB technologies (single-layer, multi-layer, flex, rigid-flex)
- Include questions about component libraries, footprints, and design standards` : '';

  return `You are an expert HR professional and technical interviewer specializing in electronics and electrical engineering. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes
- Role Focus: ${focus}
- Key Tools: ${tools.join(', ')}
- Main Challenges: ${challenges.join(', ')}

Create a structured interview with exactly 6 hiring rounds that are HIGHLY SPECIALIZED and PRACTICAL for this specific electronics role. Each round must have exactly 5 questions with hands-on challenges:

ROUND 1: Electronics Fundamentals & Theory (20-25 minutes)
- 5 technical questions covering basic electronics principles
- Topics: Ohm's law, Kirchhoff's laws, AC/DC circuits, component behavior, basic circuit analysis
- Include calculations and problem-solving scenarios
- Test understanding of voltage, current, resistance, power, and energy concepts
- Assess knowledge of passive components (resistors, capacitors, inductors) and their behavior
- Include questions about signal types, frequency response, and basic circuit theorems

ROUND 2: Component Knowledge & Selection (20-25 minutes)
- 5 questions about electronic components and their applications
- Topics: semiconductors, transistors, diodes, op-amps, microcontrollers, sensors
- Test knowledge of component specifications, ratings, and selection criteria
- Include questions about component datasheets and parameter interpretation
- Assess understanding of component packaging, mounting, and thermal considerations
- Test knowledge of component testing and measurement techniques

ROUND 3: Circuit Design & Analysis (20-25 minutes)
- 5 hands-on circuit design and analysis questions
- Topics: amplifier circuits, filter design, power supplies, digital circuits, analog circuits
- Include circuit simulation and analysis problems
- Test ability to design circuits for specific requirements
- Assess knowledge of circuit simulation tools and techniques
- Include questions about circuit optimization and performance analysis

${pcbRoundPrompt}

ROUND 5: Testing & Troubleshooting (15-20 minutes)
- 5 questions about testing, measurement, and troubleshooting techniques
- Topics: oscilloscope usage, multimeter measurements, signal analysis, fault diagnosis
- Test knowledge of test equipment and measurement techniques
- Include practical troubleshooting scenarios and problem-solving approaches
- Assess understanding of measurement accuracy, precision, and error analysis
- Test knowledge of safety procedures and electrical safety standards

ROUND 6: Project Experience & Problem Solving (15-20 minutes)
- 5 behavioral and scenario-based questions
- Focus on past electronics projects, design challenges, and problem-solving experiences
- Include questions about working with suppliers, manufacturers, and suppliers
- Test knowledge of industry standards, regulations, and best practices
- Assess communication skills for explaining technical concepts to non-technical stakeholders
- Include questions about project management, timelines, and quality assurance

CRITICAL REQUIREMENTS:
1. Each round must have EXACTLY 5 questions
2. For PCB-related questions in Round 4, include pcbDesign object with:
   - enabled: true
   - components: array of available components for the design challenge
   - constraints: design constraints and requirements
   - evaluationCriteria: specific criteria for evaluating the PCB design
3. Include followUpQuestions for interactive questions
4. Set appropriate timeLimit (3-6 minutes per question)
5. Set difficulty levels: easy, medium, hard
6. Make questions highly specific to ${title} role and electronics domain
7. Include practical, hands-on challenges and real-world scenarios
8. Ensure questions test both technical knowledge and practical application skills
9. Make questions progressive in difficulty within each round
10. Include calculations, circuit analysis, and design problems
11. Test knowledge of industry tools, standards, and best practices

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no explanations, no text outside JSON
2. Must have exactly 6 rounds with roundId: "round_1" through "round_6"
3. Each round must have exactly 5 questions with proper IDs (q1_1, q1_2, etc.)
4. All required fields must be present: id, type, question, expectedAnswer, timeLimit, difficulty, followUpQuestions
5. For PCB questions, include pcbDesign object with enabled: true
6. JSON must be complete and parseable

Return ONLY valid JSON in this exact format:
{
  "title": "AI Electronics Interview for ${title}",
  "totalDuration": ${duration},
  "rounds": [
    {
      "roundId": "round_1",
      "roundNumber": 1,
      "title": "Electronics Fundamentals & Theory",
      "description": "Test basic electronics knowledge and circuit theory",
      "duration": 25,
      "evaluationCriteria": {
        "fundamentals": "Understanding of basic electronics principles",
        "calculations": "Ability to perform circuit calculations",
        "theory": "Knowledge of circuit theory and laws"
      },
      "questions": [
        {
          "id": "q1_1",
          "type": "technical",
          "question": "Specific electronics question for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q1_2",
          "type": "technical",
          "question": "Another electronics question for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q1_3",
          "type": "technical",
          "question": "Third electronics question for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q1_4",
          "type": "technical",
          "question": "Fourth electronics question for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q1_5",
          "type": "technical",
          "question": "Fifth electronics question for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        }
      ]
    },
    {
      "roundId": "round_2",
      "roundNumber": 2,
      "title": "Component Knowledge & Selection",
      "description": "Test knowledge of electronic components and their applications",
      "duration": 25,
      "evaluationCriteria": {
        "components": "Knowledge of electronic components",
        "selection": "Component selection skills",
        "specifications": "Understanding of component specifications"
      },
      "questions": [
        {
          "id": "q2_1",
          "type": "technical",
          "question": "Component question 1 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q2_2",
          "type": "technical",
          "question": "Component question 2 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q2_3",
          "type": "technical",
          "question": "Component question 3 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q2_4",
          "type": "technical",
          "question": "Component question 4 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q2_5",
          "type": "technical",
          "question": "Component question 5 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        }
      ]
    },
    {
      "roundId": "round_3",
      "roundNumber": 3,
      "title": "Circuit Design & Analysis",
      "description": "Test circuit design and analysis skills",
      "duration": 25,
      "evaluationCriteria": {
        "design": "Circuit design skills",
        "analysis": "Circuit analysis abilities",
        "simulation": "Knowledge of simulation tools"
      },
      "questions": [
        {
          "id": "q3_1",
          "type": "technical",
          "question": "Circuit design question 1 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q3_2",
          "type": "technical",
          "question": "Circuit design question 2 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q3_3",
          "type": "technical",
          "question": "Circuit design question 3 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q3_4",
          "type": "technical",
          "question": "Circuit design question 4 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q3_5",
          "type": "technical",
          "question": "Circuit design question 5 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        }
      ]
    },
    {
      "roundId": "round_4",
      "roundNumber": 4,
      "title": "PCB Design & Circuit Analysis",
      "description": "Hands-on PCB design and circuit analysis challenges",
      "duration": 30,
      "evaluationCriteria": {
        "pcbDesign": "PCB layout and design skills",
        "circuitAnalysis": "Circuit analysis and troubleshooting",
        "componentSelection": "Component selection and specification knowledge"
      },
      "questions": [
        {
          "id": "q4_1",
          "type": "pcb-design",
          "question": "Design a PCB for a specific circuit requirement",
          "expectedAnswer": "Look for proper component placement, routing, and design considerations",
          "timeLimit": 6,
          "difficulty": "hard",
          "followUpQuestions": ["How would you optimize this design?", "What manufacturing considerations apply?"],
          "pcbDesign": {
            "enabled": true,
            "components": ["Resistor", "Capacitor", "Microcontroller", "Connector", "LED"],
            "constraints": "Single-layer PCB, 2x2 inch board, 5V power supply",
            "evaluationCriteria": "Component placement, routing quality, design for manufacturability"
          }
        },
        {
          "id": "q4_2",
          "type": "pcb-design",
          "question": "Analyze this PCB layout for potential issues",
          "expectedAnswer": "Look for signal integrity, power distribution, and manufacturability issues",
          "timeLimit": 6,
          "difficulty": "hard",
          "followUpQuestions": ["How would you fix these issues?", "What design rules apply?"],
          "pcbDesign": {
            "enabled": true,
            "components": ["Transistor", "Diode", "Capacitor", "Resistor", "Connector"],
            "constraints": "Multi-layer PCB, 4x4 inch board, 12V power supply",
            "evaluationCriteria": "Signal integrity analysis, power distribution, design rule compliance"
          }
        },
        {
          "id": "q4_3",
          "type": "pcb-design",
          "question": "Select appropriate components for this circuit",
          "expectedAnswer": "Look for proper component specifications, ratings, and compatibility",
          "timeLimit": 6,
          "difficulty": "hard",
          "followUpQuestions": ["What are the trade-offs?", "How do you ensure reliability?"],
          "pcbDesign": {
            "enabled": true,
            "components": ["Op-amp", "Capacitor", "Resistor", "Connector", "Crystal"],
            "constraints": "High-frequency circuit, 2-layer PCB, 3.3V power supply",
            "evaluationCriteria": "Component selection criteria, performance specifications, cost considerations"
          }
        },
        {
          "id": "q4_4",
          "type": "pcb-design",
          "question": "Design power distribution network for this PCB",
          "expectedAnswer": "Look for proper power plane design, decoupling, and noise reduction",
          "timeLimit": 6,
          "difficulty": "hard",
          "followUpQuestions": ["How do you minimize noise?", "What about thermal considerations?"],
          "pcbDesign": {
            "enabled": true,
            "components": ["Power connector", "Capacitor", "Inductor", "Regulator", "Connector"],
            "constraints": "Mixed-signal PCB, 6-layer board, multiple voltage rails",
            "evaluationCriteria": "Power distribution design, noise reduction, thermal management"
          }
        },
        {
          "id": "q4_5",
          "type": "pcb-design",
          "question": "Optimize this PCB layout for manufacturability",
          "expectedAnswer": "Look for design for manufacturability considerations, cost optimization",
          "timeLimit": 6,
          "difficulty": "hard",
          "followUpQuestions": ["What are the cost implications?", "How do you ensure quality?"],
          "pcbDesign": {
            "enabled": true,
            "components": ["SMD Resistor", "SMD Capacitor", "QFP Package", "Connector", "Test Point"],
            "constraints": "High-volume production, 4-layer PCB, automated assembly",
            "evaluationCriteria": "Manufacturability optimization, cost reduction, quality assurance"
          }
        }
      ]
    },
    {
      "roundId": "round_5",
      "roundNumber": 5,
      "title": "Testing & Troubleshooting",
      "description": "Test knowledge of testing and troubleshooting techniques",
      "duration": 20,
      "evaluationCriteria": {
        "testing": "Testing and measurement skills",
        "troubleshooting": "Troubleshooting abilities",
        "equipment": "Knowledge of test equipment"
      },
      "questions": [
        {
          "id": "q5_1",
          "type": "technical",
          "question": "Testing question 1 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q5_2",
          "type": "technical",
          "question": "Testing question 2 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q5_3",
          "type": "technical",
          "question": "Testing question 3 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q5_4",
          "type": "technical",
          "question": "Testing question 4 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q5_5",
          "type": "technical",
          "question": "Testing question 5 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        }
      ]
    },
    {
      "roundId": "round_6",
      "roundNumber": 6,
      "title": "Project Experience & Problem Solving",
      "description": "Test project experience and problem-solving skills",
      "duration": 20,
      "evaluationCriteria": {
        "experience": "Project experience and achievements",
        "problemSolving": "Problem-solving approach",
        "communication": "Communication and presentation skills"
      },
      "questions": [
        {
          "id": "q6_1",
          "type": "behavioral",
          "question": "Project experience question 1 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q6_2",
          "type": "behavioral",
          "question": "Project experience question 2 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q6_3",
          "type": "behavioral",
          "question": "Project experience question 3 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q6_4",
          "type": "behavioral",
          "question": "Project experience question 4 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        },
        {
          "id": "q6_5",
          "type": "behavioral",
          "question": "Project experience question 5 for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        }
      ]
    }
  ]
}

Generate questions that are highly specific to the ${title} role, electronics domain, and ${level} level. Make them practical, challenging, and relevant to real-world electronics engineering work scenarios.`;
}

async function callOpenRouterAPI(prompt, req = null) {
  console.log('🤖 [OPENROUTER] Calling OpenRouter API for electronics interview...');
  
  // Get the referer URL safely
  const getRefererUrl = () => {
    if (req) {
      return `${req.protocol}://${req.get('host')}`;
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  };
  
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    try {
      console.log(`🎯 [OPENROUTER] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);
      
      const response = await axios.post(OPENROUTER_API_URL, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional and technical interviewer specializing in electronics and electrical engineering. You MUST respond with ONLY valid JSON. Do not include any text, explanations, or markdown outside the JSON structure. The JSON must be complete and properly formatted.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 6000,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': getRefererUrl(),
          'X-Title': 'AI Electronics Hiring Platform'
        },
        timeout: 30000
      });
      
      console.log(`✅ [OPENROUTER] Success with model: ${model}`);
      return response;
      
    } catch (error) {
      console.log(`❌ [OPENROUTER] Failed with model: ${model}`, error.response?.status || error.message);
      
      if (i === FALLBACK_MODELS.length - 1) {
        console.log('💥 [OPENROUTER] All models failed');
        throw new Error('All AI models failed to generate electronics interview');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function extractJobDetailsFromPrompt(jobPrompt, req = null) {
  console.log('🔍 [JOB EXTRACTION] Extracting electronics job details from prompt...');
  
  // Get the referer URL safely
  const getRefererUrl = () => {
    if (req) {
      return `${req.protocol}://${req.get('host')}`;
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  };
  
  const extractionPrompt = `Extract job details from this user prompt and format as JSON:

User Prompt: "${jobPrompt}"

Extract and format the following information as valid JSON:
{
  "title": "Job title (e.g., Senior Electronics Engineer)",
  "description": "Comprehensive job description based on the prompt",
  "requirements": "Key requirements and qualifications",
  "level": "junior|mid|senior|lead (based on context)",
  "duration": 30,
  "company": "Company name if mentioned, otherwise 'Company'"
}

If any information is missing, make reasonable assumptions based on the context.`;

  try {
    const response = await axios.post(OPENROUTER_API_URL, {
      model: PRIMARY_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured job information from natural language descriptions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: extractionPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': getRefererUrl(),
        'X-Title': 'AI Electronics Hiring Platform'
      }
    });

    const extractedContent = response.data.choices[0].message.content;
    const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : extractedContent;
    
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('❌ [JOB EXTRACTION] Failed to extract job details:', error.message);
    throw error;
  }
}

async function saveElectronicsInterviewToDatabase(interview, userId, jobDetails = null) {
  console.log('💾 [SAVE ELECTRONICS INTERVIEW] Saving electronics interview to database...');
  
  const interviewData = {
    interviewId: `electronics_interview_${Date.now()}`,
    title: interview.title,
    totalDuration: interview.totalDuration,
    rounds: interview.rounds,
    jobTitle: jobDetails?.title || 'Electronics Engineer',
    jobDescription: jobDetails?.description || 'Electronics engineering position',
    jobRequirements: jobDetails?.requirements || 'Electronics engineering requirements',
    jobLevel: jobDetails?.level || 'mid',
    company: jobDetails?.company || 'Company',
    originalPrompt: jobDetails?.originalPrompt || 'Electronics interview generation',
    createdBy: userId,
    approvalStatus: 'pending',
    interviewType: 'electronics' // Mark as electronics interview
  };
  
  const newInterview = new Interview(interviewData);
  await newInterview.save();
  
  console.log('✅ [SAVE ELECTRONICS INTERVIEW] Electronics interview saved with ID:', newInterview.interviewId);
  return newInterview;
}

// Generate Electronics AI interview - MAIN FUNCTION
router.post('/generate-electronics', auth, async (req, res) => {
  console.log('🚀 [ELECTRONICS INTERVIEW] Starting electronics interview generation...');
  console.log('📝 [ELECTRONICS INTERVIEW] Request body:', {
    prompt: req.body.prompt?.substring(0, 200) + '...'
  });
  console.log('👤 [ELECTRONICS INTERVIEW] User ID:', req.user.id);

  try {
    const { prompt: userPrompt } = req.body;
    
    if (!userPrompt || userPrompt.trim().length < 10) {
      console.log('❌ [ELECTRONICS INTERVIEW] Validation failed - missing or too short prompt');
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a detailed electronics job description prompt (minimum 10 characters)' 
      });
    }

    console.log('✅ [ELECTRONICS INTERVIEW] Validation passed, extracting job details...');

    // Extract job details from prompt
    const jobDetails = await extractJobDetailsFromPrompt(userPrompt, req);
    console.log('✅ [ELECTRONICS INTERVIEW] Job details extracted:', {
      title: jobDetails.title,
      level: jobDetails.level,
      duration: jobDetails.duration
    });

    // Detect electronics role and get role configuration
    const detectedRole = detectElectronicsRole(jobDetails.description);
    const roleConfig = getElectronicsRoleConfig(jobDetails.title, detectedRole);
    
    console.log('🎯 [ELECTRONICS INTERVIEW] Role configuration:', {
      role: roleConfig.role,
      focus: roleConfig.focus,
      pcbRequired: roleConfig.pcbRequired
    });

    // Generate electronics interview prompt
    const interviewPrompt = generateElectronicsInterviewPrompt(jobDetails, roleConfig);
    
    console.log('🤖 [ELECTRONICS INTERVIEW] Generating electronics interview with AI...');
    
    // Call OpenRouter API to generate interview
    const aiResponse = await callOpenRouterAPI(interviewPrompt, req);
    const aiContent = aiResponse.data.choices[0].message.content;
    
    console.log('📋 [ELECTRONICS INTERVIEW] Raw AI response received, parsing...');
    
    // Parse AI response with robust parsing
    let interviewData = null;
    let aiParsingSuccessful = false;
    
    try {
      // First try the standard parsing
      interviewData = parseAIResponse(aiContent);
      if (interviewData && validateInterviewStructure(interviewData)) {
        console.log('✅ [ELECTRONICS INTERVIEW] AI response parsed and validated successfully');
        aiParsingSuccessful = true;
      } else {
        console.log('⚠️ [ELECTRONICS INTERVIEW] AI response parsed but failed validation');
        interviewData = null;
      }
    } catch (parseError) {
      console.error('❌ [ELECTRONICS INTERVIEW] Failed to parse AI response:', parseError.message);
      
      // Try to repair the JSON manually
      try {
        console.log('🔄 [ELECTRONICS INTERVIEW] Attempting manual JSON repair...');
        interviewData = repairElectronicsInterviewJSON(aiContent, jobDetails, roleConfig);
        if (interviewData && validateInterviewStructure(interviewData)) {
          console.log('✅ [ELECTRONICS INTERVIEW] Manual JSON repair successful');
          aiParsingSuccessful = true;
        } else {
          console.log('⚠️ [ELECTRONICS INTERVIEW] Manual JSON repair failed validation');
          interviewData = null;
        }
      } catch (repairError) {
        console.error('❌ [ELECTRONICS INTERVIEW] Manual JSON repair failed:', repairError.message);
        interviewData = null;
      }
    }

    // If AI parsing failed or validation failed, create fallback
    if (!aiParsingSuccessful || !interviewData) {
      console.log('🔄 [ELECTRONICS INTERVIEW] Creating fallback interview structure...');
      interviewData = createFallbackElectronicsInterview(jobDetails, roleConfig);
      console.log('✅ [ELECTRONICS INTERVIEW] Fallback interview created');
    }

    // Final validation - this should always pass with fallback
    if (!interviewData || !validateInterviewStructure(interviewData)) {
      console.error('❌ [ELECTRONICS INTERVIEW] Critical error: Fallback interview validation failed');
      console.error('🔍 [ELECTRONICS INTERVIEW] Interview data structure:', {
        hasInterviewId: !!interviewData?.interviewId,
        hasTitle: !!interviewData?.title,
        hasRounds: !!interviewData?.rounds,
        roundsLength: interviewData?.rounds?.length,
        interviewId: interviewData?.interviewId,
        title: interviewData?.title
      });
      throw new Error('Failed to create valid electronics interview structure');
    }

    // Additional electronics-specific validation and enhancement
    if (!validateElectronicsInterviewStructure(interviewData, roleConfig)) {
      console.log('🔄 [ELECTRONICS INTERVIEW] Enhancing interview with electronics-specific content...');
      interviewData = enhanceElectronicsInterviewWithPCB(interviewData, roleConfig);
    }

    // Enhance questions with PCB design capabilities
    interviewData = enhanceElectronicsInterviewWithPCB(interviewData, roleConfig);
    
    // Ensure interviewId is present
    if (!interviewData.interviewId) {
      interviewData.interviewId = `electronics_interview_${Date.now()}`;
    }
    
    // Ensure all required fields are present
    if (!interviewData.title) {
      interviewData.title = `AI Electronics Interview for ${jobDetails.title}`;
    }
    
    if (!interviewData.totalDuration) {
      interviewData.totalDuration = jobDetails.duration || 30;
    }
    
    // Save to database
    const savedInterview = await saveElectronicsInterviewToDatabase(interviewData, req.user.id, {
      ...jobDetails,
      originalPrompt: userPrompt
    });

    console.log('✅ [ELECTRONICS INTERVIEW] Electronics interview generated and saved successfully');

    return res.json({
      success: true,
      data: {
        interviewId: savedInterview.interviewId,
        title: savedInterview.title,
        totalDuration: savedInterview.totalDuration,
        rounds: savedInterview.rounds,
        interviewType: 'electronics',
        pcbRoundIncluded: roleConfig.pcbRequired,
        link: `${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/interview/${savedInterview.interviewId}`
      }
    });

  } catch (error) {
    console.error('❌ [ELECTRONICS INTERVIEW] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate electronics interview'
    });
  }
});

// Repair truncated or malformed JSON from AI response
function repairElectronicsInterviewJSON(aiContent, jobDetails, roleConfig) {
  console.log('🔧 [JSON REPAIR] Attempting to repair electronics interview JSON...');
  
  try {
    // Extract JSON from the response
    let jsonText = aiContent;
    
    // Look for JSON object boundaries
    const jsonStart = aiContent.indexOf('{');
    const jsonEnd = aiContent.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = aiContent.substring(jsonStart, jsonEnd + 1);
    }
    
    // Clean the JSON
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\n/g, ' ')     // Replace newlines with spaces
      .replace(/\r/g, ' ')     // Replace carriage returns with spaces
      .replace(/\t/g, ' ')     // Replace tabs with spaces
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
    
    // Try to find where the JSON was truncated
    const roundsMatch = jsonText.match(/"rounds":\s*\[([\s\S]*?)(?=\]|$)/);
    if (roundsMatch) {
      let roundsContent = roundsMatch[1];
      
      // Count complete round objects
      const roundMatches = roundsContent.match(/\{[^{}]*"roundId"[^{}]*\}/g);
      
      if (roundMatches && roundMatches.length > 0) {
        console.log(`🔧 [JSON REPAIR] Found ${roundMatches.length} complete rounds, attempting reconstruction...`);
        
        // If we have at least 3 rounds, try to reconstruct
        if (roundMatches.length >= 3) {
          const completeRounds = '[' + roundMatches.join(',') + ']';
          jsonText = jsonText.replace(/"rounds":\s*\[[\s\S]*?\]/, `"rounds":${completeRounds}`);
          
          // Add missing closing brackets
          let openBraces = (jsonText.match(/\{/g) || []).length;
          let closeBraces = (jsonText.match(/\}/g) || []).length;
          let openBrackets = (jsonText.match(/\[/g) || []).length;
          let closeBrackets = (jsonText.match(/\]/g) || []).length;
          
          while (openBraces > closeBraces) {
            jsonText += '}';
            closeBraces++;
          }
          while (openBrackets > closeBrackets) {
            jsonText += ']';
            closeBrackets++;
          }
          
          console.log('🔧 [JSON REPAIR] Attempting to parse repaired JSON...');
          const parsed = JSON.parse(jsonText);
          
          // Validate the repaired structure
          if (parsed && parsed.rounds && Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
            console.log('✅ [JSON REPAIR] Successfully repaired and parsed JSON');
            return parsed;
          }
        }
      }
    }
    
    console.log('⚠️ [JSON REPAIR] Could not repair JSON, returning null');
    return null;
    
  } catch (error) {
    console.error('❌ [JSON REPAIR] Error during JSON repair:', error.message);
    return null;
  }
}

// Create fallback electronics interview when AI parsing fails
function createFallbackElectronicsInterview(jobDetails, roleConfig) {
  console.log('🔄 [FALLBACK ELECTRONICS] Creating fallback electronics interview...');
  console.log('🔍 [FALLBACK ELECTRONICS] Job details:', jobDetails);
  console.log('🔍 [FALLBACK ELECTRONICS] Role config:', roleConfig);
  
  const { title, level, duration } = jobDetails;
  const { role, focus, tools, challenges, pcbRequired } = roleConfig;
  
  console.log('🔍 [FALLBACK ELECTRONICS] Extracted values:', { title, level, duration });
  
  const fallbackInterview = {
    interviewId: `electronics_interview_${Date.now()}`,
    title: `AI Electronics Interview for ${title || 'Electronics Engineer'}`,
    totalDuration: duration || 30,
    rounds: [
      {
        roundId: "round_1",
        roundNumber: 1,
        title: "Electronics Fundamentals & Theory",
        description: "Test basic electronics knowledge and circuit theory",
        duration: 25,
        evaluationCriteria: {
          fundamentals: "Understanding of basic electronics principles",
          calculations: "Ability to perform circuit calculations",
          theory: "Knowledge of circuit theory and laws"
        },
        questions: [
          {
            id: "q1_1",
            type: "technical",
            question: `Explain Ohm's law and how it applies to circuit analysis for a ${title} role.`,
            expectedAnswer: "Look for understanding of V=IR, power calculations, and practical applications",
            timeLimit: 5,
            difficulty: "easy",
            followUpQuestions: ["How would you calculate power dissipation?", "What are the limitations of Ohm's law?"]
          },
          {
            id: "q1_2",
            type: "technical",
            question: `Describe Kirchhoff's voltage and current laws and their importance in circuit analysis.`,
            expectedAnswer: "Look for understanding of KVL, KCL, and their applications in circuit solving",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: ["Can you apply these laws to solve a circuit?", "What happens when these laws are violated?"]
          },
          {
            id: "q1_3",
            type: "technical",
            question: `What is the difference between AC and DC circuits, and when would you use each?`,
            expectedAnswer: "Look for understanding of alternating vs direct current, applications, and characteristics",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: ["How do you convert between AC and DC?", "What are the advantages of each?"]
          },
          {
            id: "q1_4",
            type: "technical",
            question: `Explain the behavior of capacitors and inductors in DC and AC circuits.`,
            expectedAnswer: "Look for understanding of capacitive and inductive reactance, time constants, and frequency response",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: ["How do you calculate reactance?", "What is the time constant?"]
          },
          {
            id: "q1_5",
            type: "technical",
            question: `Describe the concept of impedance and its role in circuit analysis.`,
            expectedAnswer: "Look for understanding of complex impedance, phasor analysis, and frequency response",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["How do you calculate impedance?", "What is the difference between impedance and resistance?"]
          }
        ]
      },
      {
        roundId: "round_2",
        roundNumber: 2,
        title: "Component Knowledge & Selection",
        description: "Test knowledge of electronic components and their applications",
        duration: 25,
        evaluationCriteria: {
          components: "Knowledge of electronic components",
          selection: "Component selection skills",
          specifications: "Understanding of component specifications"
        },
        questions: [
          {
            id: "q2_1",
            type: "technical",
            question: `How do you select the appropriate resistor for a circuit? What factors do you consider?`,
            expectedAnswer: "Look for understanding of resistance value, power rating, tolerance, and temperature coefficient",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: ["What happens if you use the wrong resistor?", "How do you calculate power dissipation?"]
          },
          {
            id: "q2_2",
            type: "technical",
            question: `Explain the different types of capacitors and their applications in electronics.`,
            expectedAnswer: "Look for knowledge of ceramic, electrolytic, tantalum, and film capacitors and their uses",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: ["What are the trade-offs between different types?", "How do you choose the right capacitor?"]
          },
          {
            id: "q2_3",
            type: "technical",
            question: `Describe the operation of transistors (BJT and MOSFET) and their applications.`,
            expectedAnswer: "Look for understanding of transistor operation, biasing, and switching/amplification applications",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What's the difference between BJT and MOSFET?", "How do you bias a transistor?"]
          },
          {
            id: "q2_4",
            type: "technical",
            question: `What are operational amplifiers and how do you use them in circuit design?`,
            expectedAnswer: "Look for understanding of op-amp basics, feedback, and common configurations",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What is negative feedback?", "How do you design an amplifier?"]
          },
          {
            id: "q2_5",
            type: "technical",
            question: `How do you select microcontrollers for embedded applications?`,
            expectedAnswer: "Look for understanding of processing power, memory, peripherals, and power consumption",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What factors affect power consumption?", "How do you choose the right architecture?"]
          }
        ]
      },
      {
        roundId: "round_3",
        roundNumber: 3,
        title: "Circuit Design & Analysis",
        description: "Test circuit design and analysis skills",
        duration: 25,
        evaluationCriteria: {
          design: "Circuit design skills",
          analysis: "Circuit analysis abilities",
          simulation: "Knowledge of simulation tools"
        },
        questions: [
          {
            id: "q3_1",
            type: "technical",
            question: `Design a simple voltage divider circuit and explain how to calculate the output voltage.`,
            expectedAnswer: "Look for proper circuit design, calculation methods, and understanding of loading effects",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: ["What happens with different load resistances?", "How do you optimize the design?"]
          },
          {
            id: "q3_2",
            type: "technical",
            question: `Design a low-pass filter using RC components and explain its frequency response.`,
            expectedAnswer: "Look for proper filter design, cutoff frequency calculation, and understanding of frequency response",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What is the cutoff frequency?", "How do you improve the filter performance?"]
          },
          {
            id: "q3_3",
            type: "technical",
            question: `Design a simple power supply circuit using a voltage regulator.`,
            expectedAnswer: "Look for proper regulator selection, input/output considerations, and filtering requirements",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What about heat dissipation?", "How do you ensure stability?"]
          },
          {
            id: "q3_4",
            type: "technical",
            question: `Analyze this circuit and identify potential issues or improvements.`,
            expectedAnswer: "Look for circuit analysis skills, problem identification, and improvement suggestions",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What tools would you use for analysis?", "How do you validate your analysis?"]
          },
          {
            id: "q3_5",
            type: "technical",
            question: `Design a simple amplifier circuit and explain the design considerations.`,
            expectedAnswer: "Look for amplifier design principles, gain calculation, and stability considerations",
            timeLimit: 5,
            difficulty: "hard",
            followUpQuestions: ["What about frequency response?", "How do you ensure stability?"]
          }
        ]
      },
      {
        roundId: "round_4",
        roundNumber: 4,
        title: "PCB Design & Circuit Analysis",
        description: "Hands-on PCB design and circuit analysis challenges",
        duration: 30,
        evaluationCriteria: {
          pcbDesign: "PCB layout and design skills",
          circuitAnalysis: "Circuit analysis and troubleshooting",
          componentSelection: "Component selection and specification knowledge"
        },
        questions: [
          {
            id: "q4_1",
            type: "pcb-design",
            question: `Design a PCB layout for a simple microcontroller circuit with power supply and I/O connections.`,
            expectedAnswer: "Look for proper component placement, routing, and design considerations",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: ["How do you ensure signal integrity?", "What about power distribution?"],
            pcbDesign: {
              enabled: true,
              components: ["Microcontroller", "Crystal", "Capacitor", "Resistor", "Connector"],
              constraints: "2-layer PCB, 2x2 inch board, 3.3V power supply",
              evaluationCriteria: "Component placement, routing quality, design for manufacturability"
            }
          },
          {
            id: "q4_2",
            type: "pcb-design",
            question: `Analyze this PCB layout for potential signal integrity issues and suggest improvements.`,
            expectedAnswer: "Look for signal integrity analysis, power distribution, and manufacturability considerations",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: ["How do you minimize noise?", "What about thermal considerations?"],
            pcbDesign: {
              enabled: true,
              components: ["High-speed IC", "Capacitor", "Resistor", "Connector", "Via"],
              constraints: "4-layer PCB, high-frequency signals, mixed-signal design",
              evaluationCriteria: "Signal integrity analysis, power distribution, design rule compliance"
            }
          },
          {
            id: "q4_3",
            type: "pcb-design",
            question: `Select appropriate components for a power management circuit and justify your choices.`,
            expectedAnswer: "Look for proper component selection criteria, performance specifications, and cost considerations",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: ["What are the trade-offs?", "How do you ensure reliability?"],
            pcbDesign: {
              enabled: true,
              components: ["Voltage Regulator", "Capacitor", "Inductor", "Diode", "Connector"],
              constraints: "High-efficiency power supply, 12V input, 5V output",
              evaluationCriteria: "Component selection criteria, performance specifications, cost considerations"
            }
          },
          {
            id: "q4_4",
            type: "pcb-design",
            question: `Design the power distribution network for a mixed-signal PCB with multiple voltage rails.`,
            expectedAnswer: "Look for proper power plane design, decoupling, and noise reduction techniques",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: ["How do you minimize noise coupling?", "What about thermal management?"],
            pcbDesign: {
              enabled: true,
              components: ["Power Connector", "Decoupling Capacitor", "Power Plane", "Via", "Test Point"],
              constraints: "Mixed-signal PCB, 6-layer board, multiple voltage rails",
              evaluationCriteria: "Power distribution design, noise reduction, thermal management"
            }
          },
          {
            id: "q4_5",
            type: "pcb-design",
            question: `Optimize this PCB layout for high-volume manufacturing and cost reduction.`,
            expectedAnswer: "Look for design for manufacturability considerations, cost optimization, and quality assurance",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: ["What are the cost implications?", "How do you ensure quality?"],
            pcbDesign: {
              enabled: true,
              components: ["SMD Resistor", "SMD Capacitor", "QFP Package", "Connector", "Test Point"],
              constraints: "High-volume production, 4-layer PCB, automated assembly",
              evaluationCriteria: "Manufacturability optimization, cost reduction, quality assurance"
            }
          }
        ]
      },
      {
        roundId: "round_5",
        roundNumber: 5,
        title: "Testing & Troubleshooting",
        description: "Test knowledge of testing and troubleshooting techniques",
        duration: 20,
        evaluationCriteria: {
          testing: "Testing and measurement skills",
          troubleshooting: "Troubleshooting abilities",
          equipment: "Knowledge of test equipment"
        },
        questions: [
          {
            id: "q5_1",
            type: "technical",
            question: `How do you use an oscilloscope to measure signal characteristics?`,
            expectedAnswer: "Look for understanding of oscilloscope operation, probe selection, and measurement techniques",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["What about probe loading?", "How do you calibrate the scope?"]
          },
          {
            id: "q5_2",
            type: "technical",
            question: `Describe your approach to troubleshooting a circuit that's not working as expected.`,
            expectedAnswer: "Look for systematic troubleshooting approach, measurement techniques, and problem-solving skills",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["What tools do you use?", "How do you isolate the problem?"]
          },
          {
            id: "q5_3",
            type: "technical",
            question: `How do you measure power consumption in an embedded system?`,
            expectedAnswer: "Look for understanding of power measurement techniques, current measurement, and optimization",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["What about dynamic power?", "How do you optimize power consumption?"]
          },
          {
            id: "q5_4",
            type: "technical",
            question: `Explain how to test signal integrity in high-speed digital circuits.`,
            expectedAnswer: "Look for understanding of signal integrity testing, eye diagrams, and measurement techniques",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: ["What equipment do you need?", "How do you interpret the results?"]
          },
          {
            id: "q5_5",
            type: "technical",
            question: `How do you validate the performance of a power supply design?`,
            expectedAnswer: "Look for understanding of power supply testing, load regulation, and efficiency measurement",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: ["What about transient response?", "How do you ensure reliability?"]
          }
        ]
      },
      {
        roundId: "round_6",
        roundNumber: 6,
        title: "Project Experience & Problem Solving",
        description: "Test project experience and problem-solving skills",
        duration: 20,
        evaluationCriteria: {
          experience: "Project experience and achievements",
          problemSolving: "Problem-solving approach",
          communication: "Communication and presentation skills"
        },
        questions: [
          {
            id: "q6_1",
            type: "behavioral",
            question: `Describe a challenging electronics project you worked on and how you overcame the difficulties.`,
            expectedAnswer: "Look for project experience, problem-solving approach, and technical depth",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["What was the biggest challenge?", "How did you validate your solution?"]
          },
          {
            id: "q6_2",
            type: "behavioral",
            question: `How do you stay updated with the latest developments in electronics technology?`,
            expectedAnswer: "Look for continuous learning attitude, industry awareness, and professional development",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["What resources do you use?", "How do you apply new knowledge?"]
          },
          {
            id: "q6_3",
            type: "behavioral",
            question: `Describe a time when you had to work with a difficult team member on an electronics project.`,
            expectedAnswer: "Look for teamwork skills, conflict resolution, and communication abilities",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["How did you resolve the conflict?", "What did you learn?"]
          },
          {
            id: "q6_4",
            type: "behavioral",
            question: `How do you approach cost optimization in electronics design without compromising quality?`,
            expectedAnswer: "Look for business awareness, cost-benefit analysis, and quality considerations",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["What are the trade-offs?", "How do you measure success?"]
          },
          {
            id: "q6_5",
            type: "behavioral",
            question: `Explain a complex electronics concept to a non-technical stakeholder.`,
            expectedAnswer: "Look for communication skills, ability to simplify complex concepts, and stakeholder management",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: ["How do you ensure understanding?", "What if they don't understand?"]
          }
        ]
      }
    ]
  };
  
  // Ensure all required fields are present
  if (!fallbackInterview.interviewId) {
    fallbackInterview.interviewId = `electronics_interview_${Date.now()}`;
  }
  if (!fallbackInterview.title) {
    fallbackInterview.title = 'AI Electronics Interview for Electronics Engineer';
  }
  if (!fallbackInterview.totalDuration) {
    fallbackInterview.totalDuration = 30;
  }
  
  console.log('✅ [FALLBACK ELECTRONICS] Fallback electronics interview created successfully');
  console.log('🔍 [FALLBACK ELECTRONICS] Final fallback interview structure:', {
    hasInterviewId: !!fallbackInterview.interviewId,
    hasTitle: !!fallbackInterview.title,
    hasRounds: !!fallbackInterview.rounds,
    interviewId: fallbackInterview.interviewId,
    title: fallbackInterview.title,
    roundsLength: fallbackInterview.rounds?.length
  });
  return fallbackInterview;
}

// Validate electronics-specific interview structure
function validateElectronicsInterviewStructure(interviewData, roleConfig) {
  console.log('🔍 [ELECTRONICS VALIDATION] Validating electronics interview structure...');
  
  try {
    // Check if interview has required electronics elements
    if (!interviewData.rounds || !Array.isArray(interviewData.rounds)) {
      console.log('❌ [ELECTRONICS VALIDATION] No rounds found');
      return false;
    }

    // Check for required electronics rounds
    const roundTitles = interviewData.rounds.map(round => round.title?.toLowerCase() || '');
    
    // Must have fundamentals round
    const hasFundamentals = roundTitles.some(title => 
      title.includes('fundamentals') || title.includes('theory') || title.includes('basic')
    );
    
    // Must have component knowledge round
    const hasComponents = roundTitles.some(title => 
      title.includes('component') || title.includes('parts') || title.includes('devices')
    );
    
    // Must have circuit design round
    const hasCircuitDesign = roundTitles.some(title => 
      title.includes('circuit') || title.includes('design') || title.includes('analysis')
    );
    
    // Must have PCB round if required
    const hasPCBRound = roundTitles.some(title => 
      title.includes('pcb') || title.includes('printed circuit') || title.includes('layout')
    );
    
    if (!hasFundamentals) {
      console.log('❌ [ELECTRONICS VALIDATION] Missing fundamentals round');
      return false;
    }
    
    if (!hasComponents) {
      console.log('❌ [ELECTRONICS VALIDATION] Missing component knowledge round');
      return false;
    }
    
    if (!hasCircuitDesign) {
      console.log('❌ [ELECTRONICS VALIDATION] Missing circuit design round');
      return false;
    }
    
    if (roleConfig.pcbRequired && !hasPCBRound) {
      console.log('❌ [ELECTRONICS VALIDATION] Missing required PCB round');
      return false;
    }
    
    // Check that each round has electronics-specific questions
    for (let i = 0; i < interviewData.rounds.length; i++) {
      const round = interviewData.rounds[i];
      if (!round.questions || !Array.isArray(round.questions) || round.questions.length === 0) {
        console.log(`❌ [ELECTRONICS VALIDATION] Round ${i + 1} has no questions`);
        return false;
      }
      
      // Check for electronics-specific content in questions
      const hasElectronicsContent = round.questions.some(question => {
        const questionText = (question.question || '').toLowerCase();
        const electronicsKeywords = [
          'circuit', 'voltage', 'current', 'resistance', 'capacitor', 'transistor',
          'diode', 'op-amp', 'microcontroller', 'pcb', 'schematic', 'component',
          'electronics', 'electrical', 'signal', 'frequency', 'amplifier', 'filter'
        ];
        return electronicsKeywords.some(keyword => questionText.includes(keyword));
      });
      
      if (!hasElectronicsContent) {
        console.log(`⚠️ [ELECTRONICS VALIDATION] Round ${i + 1} may lack electronics-specific content`);
      }
    }
    
    console.log('✅ [ELECTRONICS VALIDATION] Electronics interview structure is valid');
    return true;
    
  } catch (error) {
    console.log('❌ [ELECTRONICS VALIDATION] Error during validation:', error.message);
    return false;
  }
}

// Enhance electronics interview with PCB design capabilities
function enhanceElectronicsInterviewWithPCB(interviewData, roleConfig) {
  console.log('🔧 [ENHANCE ELECTRONICS] Enhancing electronics interview with PCB capabilities...');
  
  const { pcbRequired } = roleConfig;
  
  interviewData.rounds.forEach((round, roundIndex) => {
    round.questions.forEach((question, questionIndex) => {
      // Ensure proper question ID
      question.id = `q${roundIndex + 1}_${questionIndex + 1}`;
      
      // Add PCB design capabilities for PCB-related questions
      if (question.type === 'pcb-design' || question.type === 'pcb' || 
          (roundIndex === 3 && pcbRequired)) { // Round 4 (index 3) is PCB round
        if (!question.pcbDesign) {
          question.pcbDesign = {
            enabled: true,
            components: ["Resistor", "Capacitor", "Microcontroller", "Connector", "LED", "Transistor", "Diode"],
            constraints: "Standard PCB design constraints",
            evaluationCriteria: "Component placement, routing quality, design for manufacturability"
          };
        }
      }
      
      // Ensure follow-up questions exist
      if (!question.followUpQuestions) {
        question.followUpQuestions = [];
      }
      
      // Ensure time limit exists
      if (!question.timeLimit) {
        question.timeLimit = 4;
      }
      
      // Ensure difficulty exists
      if (!question.difficulty) {
        question.difficulty = 'medium';
      }
    });
  });
  
  console.log('✅ [ENHANCE ELECTRONICS] Electronics interview enhanced successfully');
  return interviewData;
}

// Get electronics interview by ID (public access for candidates)
router.get('/public/:interviewId', async (req, res) => {
  console.log('🔍 [GET ELECTRONICS INTERVIEW] Fetching electronics interview:', req.params.interviewId);
  console.log('🔍 [GET ELECTRONICS INTERVIEW] Query params:', req.params);
  
  try {
    // First, let's check if any interview exists with this ID
    const anyInterview = await Interview.findOne({
      interviewId: req.params.interviewId
    });
    console.log('🔍 [GET ELECTRONICS INTERVIEW] Any interview found:', !!anyInterview);
    if (anyInterview) {
      console.log('🔍 [GET ELECTRONICS INTERVIEW] Interview details:', {
        id: anyInterview.interviewId,
        type: anyInterview.interviewType,
        title: anyInterview.title
      });
    }
    
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      interviewType: 'electronics'
    });

    if (!interview) {
      console.log('❌ [GET ELECTRONICS INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Electronics interview not found'
      });
    }

    console.log('✅ [GET ELECTRONICS INTERVIEW] Electronics interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      interviewType: interview.interviewType
    });

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('❌ [GET ELECTRONICS INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch electronics interview'
    });
  }
});

// Get electronics interview by ID (authenticated access)
router.get('/:interviewId', auth, async (req, res) => {
  console.log('🔍 [GET ELECTRONICS INTERVIEW AUTH] Fetching electronics interview:', req.params.interviewId);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      $or: [
        { createdBy: req.user.id },
        { interviewType: 'electronics' }
      ]
    });

    if (!interview) {
      console.log('❌ [GET ELECTRONICS INTERVIEW AUTH] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Electronics interview not found'
      });
    }

    console.log('✅ [GET ELECTRONICS INTERVIEW AUTH] Electronics interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      interviewType: interview.interviewType
    });

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('❌ [GET ELECTRONICS INTERVIEW AUTH] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch electronics interview'
    });
  }
});

// Get electronics interview by ID (protected access for recruiters)
router.get('/protected/:interviewId', auth, async (req, res) => {
  console.log('🔍 [GET ELECTRONICS INTERVIEW PROTECTED] Fetching electronics interview:', req.params.interviewId);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      $or: [
        { createdBy: req.user.id },
        { interviewType: 'electronics' }
      ]
    });

    if (!interview) {
      console.log('❌ [GET ELECTRONICS INTERVIEW PROTECTED] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Electronics interview not found'
      });
    }

    console.log('✅ [GET ELECTRONICS INTERVIEW PROTECTED] Electronics interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      interviewType: interview.interviewType
    });

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('❌ [GET ELECTRONICS INTERVIEW PROTECTED] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch electronics interview'
    });
  }
});

// Get all electronics interviews for a user
router.get('/', auth, async (req, res) => {
  console.log('📋 [GET ELECTRONICS INTERVIEWS] Fetching electronics interviews for user:', req.user.id);
  
  try {
    const filter = req.user.role === 'admin' 
      ? { interviewType: 'electronics' } 
      : { createdBy: req.user.id, interviewType: 'electronics' };
    
    const interviews = await Interview.find(filter).sort({ createdAt: -1 });

    console.log(`✅ [GET ELECTRONICS INTERVIEWS] Found ${interviews.length} electronics interviews`);

    res.json({
      success: true,
      data: interviews.map(interview => ({
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        jobTitle: interview.jobTitle,
        jobLevel: interview.jobLevel,
        company: interview.company,
        approvalStatus: interview.approvalStatus,
        interviewType: interview.interviewType,
        createdAt: interview.createdAt,
        link: `${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/interview/${interview.interviewId}`
      }))
    });
  } catch (error) {
    console.error('❌ [GET ELECTRONICS INTERVIEWS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch electronics interviews'
    });
  }
});

module.exports = router;
