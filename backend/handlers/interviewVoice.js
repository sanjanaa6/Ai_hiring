// AI Voice Interviewer handlers
const Interview = require('../../models/Interview');
const axios = require('axios');
const { OPENROUTER_API_URL, FALLBACK_MODELS, parseAIResponse } = require('../../utils/interviewUtils');

// AI Voice Interviewer endpoint - converts AI questions to speech
const aiVoice = async (req, res) => {
  console.log('🎤 [AI VOICE] Converting AI question to speech:', req.params.interviewId);
  console.log('🔍 [AI VOICE] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, language, voice } = req.body;
    
    if (!question) {
      console.log('❌ [AI VOICE] Missing question text');
      return res.status(400).json({
        success: false,
        error: 'Question text is required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [AI VOICE] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Create AI prompt for voice generation
    const aiPrompt = `
You are an AI voice interviewer. Convert this interview question into natural, conversational speech.

Question: ${question}
Language: ${language || 'English'}
Voice Style: ${voice || 'Professional but friendly'}

Requirements:
1. Make it sound natural and conversational
2. Add appropriate pauses and emphasis
3. Make it engaging and encouraging
4. Keep it concise but clear
5. Sound like a real interviewer asking the question

Convert the question into natural speech format that would sound good when spoken aloud.

Respond in JSON format:
{
  "voiceText": "The natural, conversational version of the question for speech",
  "emphasis": ["word1", "word2"],
  "pauses": [2, 5],
  "tone": "encouraging",
  "duration": "estimated duration in seconds"
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
`;

    // Try each model until one works
    let response = null;
    let lastError = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [AI VOICE] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

      try {
        response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI voice interviewer. Convert text questions into natural, conversational speech. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Voice Interviewer'
          }
        });

        console.log(`✅ [AI VOICE] Successfully used model: ${model}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`❌ [AI VOICE] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;

        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    const aiResponse = parseAIResponse(response.data.choices[0].message.content);
    
    if (!aiResponse) {
      console.log('⚠️ [AI VOICE] Failed to parse AI response, creating fallback voice text...');
      aiResponse = {
        voiceText: question,
        emphasis: [],
        pauses: [],
        tone: "encouraging",
        duration: "5"
      };
    }

    console.log('✅ [AI VOICE] Voice text generated successfully');

    res.json({
      success: true,
      data: {
        originalQuestion: question,
        voiceText: aiResponse.voiceText,
        emphasis: aiResponse.emphasis || [],
        pauses: aiResponse.pauses || [],
        tone: aiResponse.tone || "encouraging",
        duration: aiResponse.duration || "5",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [AI VOICE] Error occurred:', error.message);
    console.error('🔍 [AI VOICE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate voice text'
    });
  }
};

// AI Voice Interviewer with TTS endpoint
const aiVoiceSpeak = async (req, res) => {
  console.log('🎤 [AI VOICE SPEAK] Generating speech for AI question:', req.params.interviewId);
  console.log('🔍 [AI VOICE SPEAK] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, language, voice, speed } = req.body;
    
    if (!question) {
      console.log('❌ [AI VOICE SPEAK] Missing question text');
      return res.status(400).json({
        success: false,
        error: 'Question text is required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [AI VOICE SPEAK] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // For now, return the text that can be used with browser TTS
    // In a full implementation, you would integrate with a TTS service like Google Cloud TTS, AWS Polly, or Azure Speech
    const voiceSettings = {
      text: question,
      language: language || 'en-US',
      voice: voice || 'default',
      speed: speed || 1.0,
      pitch: 1.0,
      volume: 1.0
    };

    console.log('✅ [AI VOICE SPEAK] Voice settings prepared for TTS');

    res.json({
      success: true,
      data: {
        text: voiceSettings.text,
        language: voiceSettings.language,
        voice: voiceSettings.voice,
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
        instructions: "Use browser SpeechSynthesis API or integrate with TTS service",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [AI VOICE SPEAK] Error occurred:', error.message);
    console.error('🔍 [AI VOICE SPEAK] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate speech'
    });
  }
};

module.exports = {
  aiVoice,
  aiVoiceSpeak
};
