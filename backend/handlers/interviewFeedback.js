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
    const candidateAnswers = interview.candidateAnswers.filter(
      answer => answer.candidateId === candidateId
    );

    if (candidateAnswers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interview answers found for this candidate'
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
- Name: ${candidateName}
- Email: ${candidateEmail}
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
  "roundWiseFeedback": [
    {
      "roundTitle": "Round name",
      "score": 6.0,
      "performance": "CRITICAL assessment",
      "keyPoints": ["specific issues found"]
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
- score for EACH round as a NUMBER
- score for EACH question as a NUMBER
- ALL fields are REQUIRED

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

    // Generate PDF
    const pdfFileName = `feedback_${candidateId}_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, '../uploads', pdfFileName);
    const pdfUrl = `/uploads/${pdfFileName}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await generatePDF(pdfPath, {
      candidateName,
      candidateEmail,
      interviewTitle: interview.title,
      jobTitle: interview.jobTitle,
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
      candidateName,
      candidateEmail,
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
      generatedAt: new Date()
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

    res.json({
      success: true,
      data: feedback
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
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).fillColor('#1e40af').text('Interview Feedback Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#6b7280').text(new Date().toLocaleDateString(), { align: 'center' });
      doc.moveDown(2);

      // Candidate Information
      doc.fontSize(16).fillColor('#1f2937').text('Candidate Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#374151');
      doc.text(`Name: ${data.candidateName}`);
      doc.text(`Email: ${data.candidateEmail}`);
      doc.text(`Position: ${data.jobTitle}`);
      doc.text(`Interview: ${data.interviewTitle}`);
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
        doc.fontSize(16).fillColor('#1f2937').text('Round-wise Performance', { underline: true });
        doc.moveDown(1);

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

module.exports = {
  generateFeedback,
  getFeedback
};
