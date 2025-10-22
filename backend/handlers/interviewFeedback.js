const Interview = require('../models/Interview');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet'; // Using a good model for feedback generation

/**
 * Generate AI feedback for a candidate based on their interview performance
 */
const generateFeedback = async (req, res) => {
  try {
    console.log('🎯 [FEEDBACK] Generate feedback endpoint called');
    console.log('🎯 [FEEDBACK] Request params:', req.params);
    console.log('🎯 [FEEDBACK] Request body:', req.body);
    
    const { interviewId } = req.params;
    const { candidateId, candidateName, candidateEmail } = req.body;

    console.log('📝 [FEEDBACK] Generating feedback for candidate:', candidateName);
    console.log('📝 [FEEDBACK] Interview ID:', interviewId);
    console.log('📝 [FEEDBACK] Candidate ID:', candidateId);

    // Validate required fields
    if (!candidateId || !candidateName || !candidateEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateId, candidateName, candidateEmail'
      });
    }

    // Fetch real user details from User model
    const User = require('../models/User');
    let realCandidateName = candidateName;
    let realCandidateEmail = candidateEmail;
    
    try {
      const user = await User.findById(candidateId).select('name email');
      if (user) {
        realCandidateName = user.name;
        realCandidateEmail = user.email;
        console.log('✅ [FEEDBACK] Found real user details:', { name: realCandidateName, email: realCandidateEmail });
      } else {
        console.log('⚠️ [FEEDBACK] User not found, using provided details');
      }
    } catch (userError) {
      console.log('⚠️ [FEEDBACK] Could not fetch user details:', userError.message);
    }

    // Check if OpenRouter API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ [FEEDBACK] OPENROUTER_API_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'AI service not configured. Please contact administrator.'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Check if feedback already exists for this candidate
    const existingFeedback = interview.candidateFeedbacks.find(
      f => f.candidateId === candidateId
    );

    if (existingFeedback && existingFeedback.pdfUrl) {
      console.log('✅ [FEEDBACK] Feedback already exists, returning existing PDF');
      return res.json({
        success: true,
        data: {
          feedback: existingFeedback,
          pdfUrl: existingFeedback.pdfUrl
        }
      });
    }

    // Gather all candidate's answers and evaluations
    console.log('🔍 [FEEDBACK] Looking for answers with candidateId:', candidateId);
    console.log('🔍 [FEEDBACK] Total answers in interview:', interview.candidateAnswers.length);
    console.log('🔍 [FEEDBACK] Available candidateIds:', [...new Set(interview.candidateAnswers.map(a => a.candidateId))]);
    
    const candidateAnswers = interview.candidateAnswers.filter(
      answer => answer.candidateId === candidateId || answer.candidateId?.toString() === candidateId
    );

    console.log('🔍 [FEEDBACK] Found', candidateAnswers.length, 'answers for this candidate');

    if (candidateAnswers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interview answers found for this candidate. Please ensure the candidate has completed at least one question.'
      });
    }

    // Prepare data for AI analysis
    const roundsData = interview.rounds.map(round => {
      const roundAnswers = candidateAnswers.filter(a => a.roundId === round.roundId);
      return {
        roundTitle: round.title,
        roundId: round.roundId,
        answers: roundAnswers.map(a => {
          // Handle PCB design answers differently
          if (a.answerType === 'pcb_design' && a.pcbDesignData) {
            return {
              question: a.question,
              answer: a.designNotes || 'No explanation provided',
              pcbDesignData: a.pcbDesignData,
              pcbDesignSummary: `PCB Design JSON uploaded (${JSON.stringify(a.pcbDesignData).length} characters)`,
              timeTaken: a.timeTaken,
              aiEvaluation: a.aiEvaluation,
              answerType: 'pcb_design'
            };
          }
          return {
            question: a.question,
            answer: a.answer,
            timeTaken: a.timeTaken,
            aiEvaluation: a.aiEvaluation,
            answerType: a.answerType || 'text'
          };
        })
      };
    }).filter(r => r.answers.length > 0);

    // Create STRICT evaluation prompt - NO LENIENT SCORING
    const prompt = `You are a STRICT technical interviewer evaluating candidate performance. Be CRITICAL and HONEST in your assessment.

**Candidate Information:**
- Name: ${realCandidateName}
- Email: ${realCandidateEmail}
- Interview: ${interview.title}
- Position: ${interview.jobTitle}

**Interview Questions and Answers:**
${roundsData.map((round, idx) => `
Round ${idx + 1}: ${round.roundTitle}
${round.answers.map((a, qIdx) => {
  if (a.answerType === 'pcb_design') {
    return `
Q${qIdx + 1}: ${a.question}
Answer Type: PCB Design Submission
Design Notes: ${a.answer}
PCB Design Data: ${a.pcbDesignSummary}
[Note: Evaluate based on design notes and the fact that a PCB design JSON was submitted]
`;
  }
  return `
Q${qIdx + 1}: ${a.question}
Answer: ${a.answer}
`;
}).join('\n')}
`).join('\n')}

**STRICT Evaluation Requirements:**
1. Score each answer on a scale of 0-10 (0 = completely wrong, 10 = perfect)
2. Be HARSH - only give high scores for truly excellent answers
3. Identify ALL weaknesses and gaps in knowledge
4. NO sugar-coating - be brutally honest
5. If answer is vague, incomplete, or wrong - say so directly
6. If candidate says "I don't know" - mark it as a failure
7. Empty or very short answers should get 0-2 points
8. Calculate overall score as average of all question scores

**REQUIRED JSON OUTPUT (MUST INCLUDE ALL FIELDS):**
{
  "overallScore": 5.5,
  "overallPerformance": "HONEST assessment - mention specific weaknesses",
  "strengths": ["only list REAL strengths, max 3"],
  "areasForImprovement": ["be SPECIFIC about what's wrong, list ALL issues"],
  "recommendations": ["CONCRETE steps to improve"],
  "skillScores": {
    "codingSkills": 6.5,
    "salesSkills": 7.0,
    "pcbDesignSkills": 5.5,
    "communicationSkills": 8.0,
    "englishFluency": 7.5
  },
  "roundWiseFeedback": [
    {
      "roundTitle": "Round name",
      "score": 6.0,
      "performance": "CRITICAL assessment",
      "keyPoints": ["specific issues found"],
      "skillBreakdown": {
        "technicalSkills": 6.0,
        "communicationSkills": 7.0,
        "problemSolving": 5.5
      }
    }
  ],
  "questionScores": [
    {
      "question": "question text",
      "answer": "candidate's answer",
      "score": 7,
      "reasoning": "why this score - specific"
    }
  ]
}

**CRITICAL: You MUST include:**
- overallScore as a NUMBER (not string)
- skillScores object with numbers for: codingSkills, salesSkills, pcbDesignSkills, communicationSkills, englishFluency (0-10 scale, use 0 if not applicable)
- score for EACH round as a NUMBER
- skillBreakdown for EACH round with relevant skill scores
- score for EACH question as a NUMBER
- ALL fields are REQUIRED

**Skill Assessment Guidelines:**
- Coding Skills: Evaluate programming logic, syntax, algorithms, data structures
- Sales Skills: Assess persuasion, product knowledge, customer handling, negotiation
- PCB Design Skills: Judge circuit design, component selection, layout optimization
- Communication Skills: Rate clarity, articulation, structure, professional language
- English Fluency: Measure grammar, vocabulary, sentence construction, coherence

**CRITICAL RULES:**
- DO NOT give participation points
- DO NOT be encouraging if performance is poor
- DO NOT inflate scores
- BE HONEST about skill gaps
- ONLY return valid JSON, no extra text`;

    console.log('🤖 [FEEDBACK] Calling OpenRouter API for feedback generation...');
    console.log('📊 [FEEDBACK] Sending data for', candidateAnswers.length, 'answers');
    console.log('📊 [FEEDBACK] Rounds with answers:', roundsData.length);
    console.log('📄 [FEEDBACK] Prompt preview:', prompt.substring(0, 500));

    // Call OpenRouter API with STRICT settings
    const openRouterResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a STRICT technical interviewer. Be critical, honest, and harsh in your evaluations. Do not give inflated scores or participation points.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, strict evaluation
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'AI Hiring Platform - Strict Feedback Generation'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    const aiResponse = openRouterResponse.data.choices[0].message.content;
    console.log('✅ [FEEDBACK] Received AI response');
    console.log('📄 [FEEDBACK] Response preview:', aiResponse.substring(0, 200));

    // Parse AI response - NO FALLBACK, must be valid JSON
    let feedbackData;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      feedbackData = JSON.parse(jsonMatch[0]);
      
      console.log('🔍 [FEEDBACK] Parsed data - overallScore:', feedbackData.overallScore);
      console.log('🔍 [FEEDBACK] Parsed data - questionScores:', feedbackData.questionScores?.length || 0);
      
      // Validate and fix missing scores
      if (!feedbackData.overallScore || typeof feedbackData.overallScore !== 'number') {
        console.warn('⚠️ [FEEDBACK] AI did not provide overallScore, calculating...');
        
        // Calculate from question scores if available
        if (feedbackData.questionScores && feedbackData.questionScores.length > 0) {
          const totalScore = feedbackData.questionScores.reduce((sum, q) => sum + (q.score || 0), 0);
          feedbackData.overallScore = parseFloat((totalScore / feedbackData.questionScores.length).toFixed(1));
        } else {
          // Calculate based on answer quality
          console.warn('⚠️ [FEEDBACK] No question scores from AI, analyzing answers...');
          
          let totalScore = 0;
          feedbackData.questionScores = [];
          
          candidateAnswers.forEach(ans => {
            let score = 5; // Default middle score
            const answer = (ans.answer || '').toLowerCase();
            
            // STRICT scoring based on answer content
            if (!answer || answer.length < 10) {
              score = 1; // Empty or very short
            } else if (answer.includes('i don\'t know') || answer.includes('no idea') || answer.includes('i have no idea')) {
              score = 1; // Explicit "don't know"
            } else if (answer.length < 50) {
              score = 3; // Too brief
            } else if (answer.length < 100) {
              score = 5; // Average
            } else if (answer.length < 200) {
              score = 7; // Good detail
            } else {
              score = 8; // Comprehensive
            }
            
            totalScore += score;
            feedbackData.questionScores.push({
              question: ans.question,
              answer: ans.answer,
              score: score,
              reasoning: `Answer length: ${answer.length} characters. ${score <= 3 ? 'Insufficient detail or knowledge gap.' : score >= 7 ? 'Good comprehensive answer.' : 'Adequate but could be more detailed.'}`
            });
          });
          
          feedbackData.overallScore = parseFloat((totalScore / candidateAnswers.length).toFixed(1));
          console.log('📊 [FEEDBACK] Calculated overall score:', feedbackData.overallScore);
        }
      }
      
      // Ensure round scores exist
      if (feedbackData.roundWiseFeedback && feedbackData.roundWiseFeedback.length > 0) {
        feedbackData.roundWiseFeedback.forEach(round => {
          if (!round.score) {
            round.score = feedbackData.overallScore; // Use overall score as fallback
          }
        });
      }
      
      // Validate required fields
      if (!feedbackData.overallPerformance) {
        throw new Error('Missing overallPerformance in AI response');
      }
      
      console.log('✅ [FEEDBACK] Parsed feedback data');
      console.log('📊 [FEEDBACK] Overall Score:', feedbackData.overallScore);
      console.log('📊 [FEEDBACK] Question Scores:', feedbackData.questionScores?.length || 0);
      
    } catch (parseError) {
      console.error('❌ [FEEDBACK] Failed to parse AI response:', parseError.message);
      console.error('❌ [FEEDBACK] AI Response:', aiResponse);
      
      // NO FALLBACK - return error immediately
      return res.status(500).json({
        success: false,
        error: 'AI failed to generate valid feedback. Please try again or contact support.'
      });
    }

    // Detect interview type from job title or interview title
    const interviewType = interview.jobTitle || interview.title || 'General Interview';
    
    // Extract skill categories from feedback data
    const skillCategories = feedbackData.skillScores ? 
      Object.keys(feedbackData.skillScores) : 
      ['Technical Skills', 'Communication', 'Problem Solving'];
    
    // Collect monitoring data if available from interview
    const candidateFeedbackData = interview.candidateFeedbacks.find(
      f => f.candidateId === candidateId
    );
    
    const monitoringData = {
      profileImage: candidateFeedbackData?.monitoringData?.profileImage || null,
      interviewSnapshots: candidateFeedbackData?.monitoringData?.interviewSnapshots || [],
      cheatAttempts: candidateFeedbackData?.monitoringData?.cheatAttempts || { flagged: false },
      eyeTrackingViolations: candidateFeedbackData?.monitoringData?.eyeTrackingViolations || 0,
      faceDetectionIssues: candidateFeedbackData?.monitoringData?.faceDetectionIssues || 0
    };
    
    console.log('📸 [FEEDBACK] Monitoring data:', {
      hasProfileImage: !!monitoringData.profileImage,
      snapshotCount: monitoringData.interviewSnapshots.length,
      cheatFlagged: monitoringData.cheatAttempts.flagged,
      eyeViolations: monitoringData.eyeTrackingViolations,
      faceIssues: monitoringData.faceDetectionIssues
    });

    // Generate PDF
    const pdfFileName = `feedback_${candidateId}_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, '../uploads', pdfFileName);
    const pdfUrl = `/api/interviews/${interviewId}/feedback/${candidateId}/pdf`; // Protected URL

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('📄 [FEEDBACK] Generating PDF with data:', {
      candidateName: realCandidateName,
      candidateEmail: realCandidateEmail,
      interviewTitle: interview.title,
      jobTitle: interview.jobTitle,
      interviewType,
      overallScore: feedbackData.overallScore
    });

    await generatePDF(pdfPath, {
      candidateName: realCandidateName,
      candidateEmail: realCandidateEmail,
      interviewTitle: interview.title,
      jobTitle: interview.jobTitle,
      interviewType,
      skillCategories,
      monitoringData,
      ...feedbackData
    });

    console.log('✅ [FEEDBACK] PDF generated at:', pdfPath);

    // Collect PCB design data if any
    const pcbDesigns = candidateAnswers
      .filter(a => a.answerType === 'pcb_design' && a.pcbDesignData)
      .map(a => ({
        question: a.question,
        pcbDesignData: a.pcbDesignData,
        designNotes: a.designNotes,
        submittedAt: a.submittedAt
      }));

    // Save feedback to database with STRICT SCORES
    const feedback = {
      candidateId,
      candidateName: realCandidateName,
      candidateEmail: realCandidateEmail,
      overallScore: feedbackData.overallScore, // NEW: Overall score 0-10
      overallPerformance: feedbackData.overallPerformance,
      strengths: feedbackData.strengths || [],
      areasForImprovement: feedbackData.areasForImprovement || [],
      recommendations: feedbackData.recommendations || [],
      roundWiseFeedback: feedbackData.roundWiseFeedback || [],
      questionScores: feedbackData.questionScores || [], // NEW: Individual question scores
      pcbDesigns: pcbDesigns.length > 0 ? pcbDesigns : undefined, // Include PCB designs if any
      pdfUrl,
      pdfPath,
      generatedAt: new Date(),
      downloadAllowed: false // Require recruiter approval before candidate can download
    };
    
    console.log('📊 [FEEDBACK] Feedback Summary:');
    console.log(`   Overall Score: ${feedback.overallScore}/10`);
    console.log(`   Strengths: ${feedback.strengths.length}`);
    console.log(`   Improvements: ${feedback.areasForImprovement.length}`);
    console.log(`   Question Scores: ${feedback.questionScores.length}`);

    // Add or update feedback
    const feedbackIndex = interview.candidateFeedbacks.findIndex(
      f => f.candidateId === candidateId
    );

    if (feedbackIndex >= 0) {
      interview.candidateFeedbacks[feedbackIndex] = feedback;
    } else {
      interview.candidateFeedbacks.push(feedback);
    }

    await interview.save();

    console.log('✅ [FEEDBACK] Feedback saved to database');

    res.json({
      success: true,
      data: {
        feedback,
        pdfUrl
      }
    });

  } catch (error) {
    console.error('❌ [FEEDBACK] Error generating feedback:', error);
    console.error('❌ [FEEDBACK] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate feedback'
    });
  }
};

/**
 * Get feedback for a specific candidate
 */
const getFeedback = async (req, res) => {
  try {
    const { interviewId, candidateId } = req.params;

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const feedback = interview.candidateFeedbacks.find(
      f => f.candidateId === candidateId
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found for this candidate'
      });
    }

    // Check if user is authenticated
    const isAuthenticated = req.user && req.user.id;
    const isRecruiter = isAuthenticated && (req.user.role === 'recruiter' || req.user.role === 'admin');
    const isCandidate = isAuthenticated && req.user.id === candidateId;

    // If candidate is requesting their own feedback, check download permission
    if (isCandidate && !isRecruiter) {
      if (!feedback.downloadAllowed) {
        return res.status(403).json({
          success: false,
          error: 'Feedback download not yet approved by recruiter',
          downloadAllowed: false,
          message: 'Your feedback is being reviewed. You will be notified when it is available for download.'
        });
      }
    }

    // Return feedback (recruiters can always see it, candidates only if approved)
    res.json({
      success: true,
      data: feedback,
      downloadAllowed: feedback.downloadAllowed
    });

  } catch (error) {
    console.error('❌ [FEEDBACK] Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch feedback'
    });
  }
};

/**
 * Generate PDF document with feedback
 */
async function generatePDF(filePath, data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).fillColor('#1e40af').text('Interview Feedback Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#6b7280').text(new Date().toLocaleDateString(), { align: 'center' });
      doc.moveDown(2);

      // Candidate Information Section with Profile Image
      doc.fontSize(16).fillColor('#1f2937').text('Candidate Information', { underline: true });
      doc.moveDown(0.5);
      
      const infoStartY = doc.y;
      
      // Profile Image (if available)
      if (data.monitoringData?.profileImage) {
        try {
          const imageX = doc.page.width - 150;
          const imageY = infoStartY;
          doc.image(data.monitoringData.profileImage, imageX, imageY, {
            width: 100,
            height: 100,
            fit: [100, 100],
            align: 'center'
          });
          doc.fontSize(8).fillColor('#6b7280').text('Profile Photo', imageX, imageY + 105, { width: 100, align: 'center' });
        } catch (imgError) {
          console.warn('⚠️ [PDF] Could not load profile image:', imgError.message);
        }
      }
      
      // Candidate details
      doc.fontSize(11).fillColor('#374151');
      doc.text(`Name: ${data.candidateName || 'N/A'}`, 50, infoStartY);
      doc.text(`Email: ${data.candidateEmail || 'N/A'}`);
      doc.text(`Position: ${data.jobTitle || 'N/A'}`);
      doc.text(`Interview: ${data.interviewTitle || 'N/A'}`);
      doc.moveDown(2);

      // OVERALL SCORE - PROMINENT DISPLAY
      doc.fontSize(20).fillColor('#dc2626').text('OVERALL SCORE', { underline: true, align: 'center' });
      doc.moveDown(0.5);
      
      const scoreColor = data.overallScore >= 7 ? '#059669' : data.overallScore >= 5 ? '#f59e0b' : '#dc2626';
      doc.fontSize(48).fillColor(scoreColor).text(`${data.overallScore}/10`, { align: 'center' });
      doc.moveDown(1);
      
      const scoreLabel = data.overallScore >= 7 ? 'Good Performance' : 
                        data.overallScore >= 5 ? 'Average Performance' : 
                        'Needs Improvement';
      doc.fontSize(14).fillColor('#6b7280').text(scoreLabel, { align: 'center' });
      doc.moveDown(2);

      // Overall Performance
      doc.fontSize(16).fillColor('#1f2937').text('Performance Assessment', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#374151').text(data.overallPerformance, { align: 'justify' });
      doc.moveDown(2);

      // Strengths
      doc.fontSize(16).fillColor('#059669').text('Strengths', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#374151');
      data.strengths.forEach((strength, idx) => {
        doc.text(`${idx + 1}. ${strength}`, { indent: 20 });
        doc.moveDown(0.3);
      });
      doc.moveDown(1);

      // Areas for Improvement
      doc.fontSize(16).fillColor('#dc2626').text('Areas for Improvement', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#374151');
      data.areasForImprovement.forEach((area, idx) => {
        doc.text(`${idx + 1}. ${area}`, { indent: 20 });
        doc.moveDown(0.3);
      });
      doc.moveDown(1);

      // Recommendations
      doc.fontSize(16).fillColor('#7c3aed').text('Recommendations', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#374151');
      data.recommendations.forEach((rec, idx) => {
        doc.text(`${idx + 1}. ${rec}`, { indent: 20 });
        doc.moveDown(0.3);
      });
      doc.moveDown(2);

      // Skill Scores Section
      if (data.skillScores) {
        doc.addPage();
        doc.fontSize(18).fillColor('#1e40af').text('Skill Assessment', { underline: true, align: 'center' });
        doc.moveDown(1.5);

        const skills = [
          { key: 'codingSkills', label: 'Coding Skills', icon: '[CODE]' },
          { key: 'salesSkills', label: 'Sales Skills', icon: '[SALES]' },
          { key: 'pcbDesignSkills', label: 'PCB Design Skills', icon: '[PCB]' },
          { key: 'communicationSkills', label: 'Communication Skills', icon: '[COMM]' },
          { key: 'englishFluency', label: 'English Fluency', icon: '[ENG]' }
        ];

        skills.forEach(skill => {
          const score = data.skillScores[skill.key] || 0;
          if (score > 0) {
            const skillColor = score >= 7 ? '#059669' : score >= 5 ? '#f59e0b' : '#dc2626';
            
            doc.fontSize(12).fillColor('#1f2937').text(`${skill.label}`, { continued: true });
            doc.fontSize(14).fillColor(skillColor).text(` - ${score}/10`, { align: 'right' });
            
            // Progress bar
            const barWidth = 400;
            const barHeight = 15;
            const barX = 80;
            const barY = doc.y + 5;
            
            // Background bar
            doc.rect(barX, barY, barWidth, barHeight).fillColor('#e5e7eb').fill();
            
            // Progress bar
            const progressWidth = (score / 10) * barWidth;
            doc.rect(barX, barY, progressWidth, barHeight).fillColor(skillColor).fill();
            
            doc.moveDown(2);
          }
        });
      }

      // Monitoring & Integrity Section
      doc.addPage();
      doc.fontSize(18).fillColor('#dc2626').text('Interview Monitoring & Integrity', { underline: true, align: 'center' });
      doc.moveDown(1.5);

      // Cheat Detection
      doc.fontSize(14).fillColor('#1f2937').text('Integrity Check', { underline: true });
      doc.moveDown(0.5);
      
      const cheatStatus = data.monitoringData?.cheatAttempts?.flagged ? 'FLAGGED' : 'CLEAR';
      const cheatColor = data.monitoringData?.cheatAttempts?.flagged ? '#dc2626' : '#059669';
      
      doc.fontSize(12).fillColor('#374151').text('Status: ', { continued: true });
      doc.fontSize(12).fillColor(cheatColor).text(cheatStatus);
      
      if (data.monitoringData?.cheatAttempts?.flagged) {
        doc.fontSize(11).fillColor('#dc2626').text(`Reason: ${data.monitoringData.cheatAttempts.reason || 'Suspicious activity detected'}`, { indent: 20 });
        doc.fontSize(11).fillColor('#6b7280').text(`Flagged at: ${data.monitoringData.cheatAttempts.flaggedAt ? new Date(data.monitoringData.cheatAttempts.flaggedAt).toLocaleString() : 'N/A'}`, { indent: 20 });
      } else {
        doc.fontSize(11).fillColor('#059669').text('No suspicious activity detected during the interview.', { indent: 20 });
      }
      doc.moveDown(1);

      // Eye Tracking & Face Detection
      doc.fontSize(11).fillColor('#374151');
      doc.text(`Eye Tracking Violations: ${data.monitoringData?.eyeTrackingViolations || 0}`);
      doc.text(`Face Detection Issues: ${data.monitoringData?.faceDetectionIssues || 0}`);
      doc.moveDown(2);

      // Interview Snapshots
      if (data.monitoringData?.interviewSnapshots && data.monitoringData.interviewSnapshots.length > 0) {
        doc.fontSize(14).fillColor('#1f2937').text('Interview Snapshots', { underline: true });
        doc.moveDown(0.5);
        
        const snapshotsToShow = data.monitoringData.interviewSnapshots.slice(0, 2); // Show max 2 snapshots
        const snapshotWidth = 200;
        const snapshotHeight = 150;
        let snapshotX = 80;
        const snapshotY = doc.y;

        snapshotsToShow.forEach((snapshot, idx) => {
          try {
            if (fs.existsSync(snapshot)) {
              doc.image(snapshot, snapshotX, snapshotY, {
                width: snapshotWidth,
                height: snapshotHeight,
                fit: [snapshotWidth, snapshotHeight]
              });
              doc.fontSize(8).fillColor('#6b7280').text(`Snapshot ${idx + 1}`, snapshotX, snapshotY + snapshotHeight + 5, { width: snapshotWidth, align: 'center' });
              snapshotX += snapshotWidth + 20;
            }
          } catch (imgError) {
            console.warn(`⚠️ [PDF] Could not load snapshot ${idx + 1}:`, imgError.message);
          }
        });
        
        doc.moveDown(12); // Move down to account for images
      } else {
        doc.fontSize(11).fillColor('#6b7280').text('No interview snapshots available.', { indent: 20 });
        doc.moveDown(1);
      }

      // Question-by-Question Scores (NEW - STRICT SCORING)
      if (data.questionScores && data.questionScores.length > 0) {
        doc.addPage();
        doc.fontSize(18).fillColor('#dc2626').text('DETAILED QUESTION SCORES', { underline: true, align: 'center' });
        doc.moveDown(1.5);

        data.questionScores.forEach((qs, idx) => {
          // Question number and score
          const qScoreColor = qs.score >= 7 ? '#059669' : qs.score >= 5 ? '#f59e0b' : '#dc2626';
          doc.fontSize(12).fillColor('#1f2937').text(`Question ${idx + 1}`, { continued: true });
          doc.fontSize(14).fillColor(qScoreColor).text(` - Score: ${qs.score}/10`, { align: 'right' });
          doc.moveDown(0.3);
          
          // Question text
          doc.fontSize(10).fillColor('#6b7280').text('Q: ' + qs.question, { indent: 10 });
          doc.moveDown(0.3);
          
          // Answer
          doc.fontSize(10).fillColor('#374151').text('A: ' + (qs.answer.length > 200 ? qs.answer.substring(0, 200) + '...' : qs.answer), { indent: 10 });
          doc.moveDown(0.3);
          
          // Reasoning
          doc.fontSize(10).fillColor('#dc2626').text('Evaluation: ' + qs.reasoning, { indent: 10, align: 'justify' });
          doc.moveDown(1);
          
          // Add separator
          doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
          doc.moveDown(1);
        });
      }

      // Round-wise Feedback
      if (data.roundWiseFeedback && data.roundWiseFeedback.length > 0) {
        doc.addPage();
        doc.fontSize(18).fillColor('#1e40af').text('Round-wise Performance', { underline: true, align: 'center' });
        doc.moveDown(1.5);

        data.roundWiseFeedback.forEach((round, idx) => {
          // Show round score if available
          doc.fontSize(14).fillColor('#1e40af').text(`${round.roundTitle}`, { continued: true });
          if (round.score !== undefined) {
            const roundScoreColor = round.score >= 7 ? '#059669' : round.score >= 5 ? '#f59e0b' : '#dc2626';
            doc.fontSize(12).fillColor(roundScoreColor).text(` - ${round.score}/10`, { align: 'right' });
          } else {
            doc.text('');
          }
          doc.moveDown(0.3);
          doc.fontSize(11).fillColor('#374151').text(round.performance, { align: 'justify' });
          doc.moveDown(0.5);
          
          // Skill Breakdown for this round
          if (round.skillBreakdown && Object.keys(round.skillBreakdown).length > 0) {
            doc.fontSize(11).fillColor('#6b7280').text('Skill Breakdown:', { underline: true });
            doc.moveDown(0.3);
            
            Object.entries(round.skillBreakdown).forEach(([skill, score]) => {
              const skillColor = score >= 7 ? '#059669' : score >= 5 ? '#f59e0b' : '#dc2626';
              const skillLabel = skill.replace(/([A-Z])/g, ' $1').trim();
              const capitalizedLabel = skillLabel.charAt(0).toUpperCase() + skillLabel.slice(1);
              
              doc.fontSize(10).fillColor('#374151').text(`  ${capitalizedLabel}: `, { continued: true });
              doc.fontSize(10).fillColor(skillColor).text(`${score}/10`);
            });
            doc.moveDown(0.5);
          }
          
          if (round.keyPoints && round.keyPoints.length > 0) {
            doc.fontSize(11).fillColor('#6b7280').text('Key Points:', { underline: true });
            doc.moveDown(0.3);
            round.keyPoints.forEach((point, pIdx) => {
              doc.fontSize(10).fillColor('#374151').text(`• ${point}`, { indent: 20 });
              doc.moveDown(0.2);
            });
          }
          doc.moveDown(1.5);
        });
      }

      // Footer
      doc.fontSize(8).fillColor('#9ca3af').text(
        'This is an AI-generated feedback report. For questions, please contact the hiring team.',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();

      stream.on('finish', () => {
        console.log('✅ [PDF] PDF generation completed');
        resolve();
      });

      stream.on('error', (error) => {
        console.error('❌ [PDF] PDF generation error:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ [PDF] Error in generatePDF:', error);
      reject(error);
    }
  });
}

/**
 * Allow candidate to download feedback (Recruiter only)
 */
const allowFeedbackDownload = async (req, res) => {
  try {
    const { interviewId, candidateId } = req.params;

    console.log('✅ [FEEDBACK] Allow download request:', { interviewId, candidateId, recruiterId: req.user.id });

    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only recruiters and admins can approve feedback downloads'
      });
    }

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const feedbackIndex = interview.candidateFeedbacks.findIndex(
      f => f.candidateId === candidateId
    );

    if (feedbackIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found for this candidate'
      });
    }

    // Update download permission
    interview.candidateFeedbacks[feedbackIndex].downloadAllowed = true;
    interview.candidateFeedbacks[feedbackIndex].downloadApprovedBy = req.user.id;
    interview.candidateFeedbacks[feedbackIndex].downloadApprovedAt = new Date();
    interview.candidateFeedbacks[feedbackIndex].downloadDeniedReason = undefined;

    await interview.save();

    console.log('✅ [FEEDBACK] Download approved for candidate:', candidateId);

    res.json({
      success: true,
      message: 'Feedback download approved',
      data: interview.candidateFeedbacks[feedbackIndex]
    });

  } catch (error) {
    console.error('❌ [FEEDBACK] Error approving download:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve feedback download'
    });
  }
};

/**
 * Deny candidate feedback download (Recruiter only)
 */
const denyFeedbackDownload = async (req, res) => {
  try {
    const { interviewId, candidateId } = req.params;
    const { reason } = req.body;

    console.log('🚫 [FEEDBACK] Deny download request:', { interviewId, candidateId, reason });

    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only recruiters and admins can deny feedback downloads'
      });
    }

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const feedbackIndex = interview.candidateFeedbacks.findIndex(
      f => f.candidateId === candidateId
    );

    if (feedbackIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found for this candidate'
      });
    }

    // Update download permission
    interview.candidateFeedbacks[feedbackIndex].downloadAllowed = false;
    interview.candidateFeedbacks[feedbackIndex].downloadDeniedReason = reason || 'Download denied by recruiter';
    interview.candidateFeedbacks[feedbackIndex].downloadApprovedBy = undefined;
    interview.candidateFeedbacks[feedbackIndex].downloadApprovedAt = undefined;

    await interview.save();

    console.log('🚫 [FEEDBACK] Download denied for candidate:', candidateId);

    res.json({
      success: true,
      message: 'Feedback download denied',
      data: interview.candidateFeedbacks[feedbackIndex]
    });

  } catch (error) {
    console.error('❌ [FEEDBACK] Error denying download:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deny feedback download'
    });
  }
};

/**
 * Serve feedback PDF file (with permission check)
 */
const serveFeedbackPDF = async (req, res) => {
  try {
    const { interviewId, candidateId } = req.params;

    console.log('📄 [FEEDBACK PDF] Request:', { interviewId, candidateId, userId: req.user?.id });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const feedback = interview.candidateFeedbacks.find(
      f => f.candidateId === candidateId
    );

    if (!feedback || !feedback.pdfPath) {
      return res.status(404).json({
        success: false,
        error: 'Feedback PDF not found'
      });
    }

    // Check permissions
    const isRecruiter = req.user.role === 'recruiter' || req.user.role === 'admin';
    const isCandidate = req.user.id === candidateId;

    // Recruiters can always download
    if (!isRecruiter) {
      // Candidates need approval
      if (!isCandidate) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (!feedback.downloadAllowed) {
        return res.status(403).json({
          success: false,
          error: 'Feedback download not yet approved by recruiter',
          downloadAllowed: false
        });
      }
    }

    // Serve the PDF file
    const pdfPath = path.resolve(feedback.pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found on server'
      });
    }

    console.log('✅ [FEEDBACK PDF] Serving file:', pdfPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="feedback_${candidateId}.pdf"`);
    res.sendFile(pdfPath);

  } catch (error) {
    console.error('❌ [FEEDBACK PDF] Error serving PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to serve feedback PDF'
    });
  }
};

module.exports = {
  generateFeedback,
  getFeedback,
  allowFeedbackDownload,
  denyFeedbackDownload,
  serveFeedbackPDF
};
