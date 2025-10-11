import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  VolumeX, 
  MessageSquare, 
  Users, 
  Target,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';
import apiService from '../../services/apiService';

const ConversationalSalesRound = ({
  round,
  currentQuestion,
  questionIndex,
  timeRemaining,
  isAISpeaking,
  isRecording,
  transcription,
  interimTranscription,
  onStartRecording,
  onStopRecording,
  onClearTranscription,
  onNextQuestion,
  onSubmitAnswer,
  onToggleAISpeaking,
  onSpeakText,
  candidateInfo,
  isDarkMode
}) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscription, setLastTranscription] = useState('');
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  
  const conversationEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const stopSpeaking = useCallback(() => {
    // Stop any ongoing TTS (handled by the TTS service)
    onToggleAISpeaking(false);
  }, [onToggleAISpeaking]);

  // Initialize the sales scenario
  const initializeSalesScenario = useCallback(() => {
    if (!currentQuestion) return;

    const scenario = {
      id: currentQuestion.id,
      title: currentQuestion.question,
      type: currentQuestion.type || 'role-play',
      context: "You're in a sales meeting with a potential client. They're interested in your product but have some concerns to address.",
      objectives: [
        "Build rapport and understand customer needs",
        "Present value proposition effectively", 
        "Handle objections professionally",
        "Close the deal or secure next steps"
      ],
      customerProfile: {
        name: "Alex Johnson",
        title: "VP of Operations", 
        company: "TechCorp Solutions",
        painPoints: ["Inefficient processes", "High operational costs", "Need for better analytics"],
        budget: "Mid-range",
        timeline: "3-6 months",
        decisionMakingStyle: "Analytical and data-driven"
      }
    };

    setCurrentScenario(scenario);
    setConversationStep(0);
    setIsConversationComplete(false);

    // Add initial question to conversation
    const initialQuestion = currentQuestion.question || "Let's start our sales conversation. How would you approach this situation?";
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: initialQuestion,
      timestamp: new Date(),
      step: 0
    };

    setConversationHistory([welcomeMessage]);
  }, [currentQuestion]);

  // Generate AI conversational question based on conversation context
  const generateStepQuestion = useCallback(async (step, scenario) => {
    try {
      // Get the conversation context for AI
      const conversationContext = conversationHistory.map(msg => ({
        type: msg.type,
        content: msg.content,
        step: msg.step
      }));

      const response = await apiService.client.post('/ai/generate-sales-response', {
        step: step,
        scenario: scenario,
        userInput: 'user_response',
        conversationContext: conversationContext,
        isQuestionGeneration: true
      });

      if (response.data.success && response.data.data.content) {
        return response.data.data.content;
      } else {
        // Context-aware fallback questions based on conversation
        const lastUserMessage = conversationHistory.filter(msg => msg.type === 'user').pop();
        const userResponse = lastUserMessage?.content || '';
        
        if (userResponse.toLowerCase().includes('no idea') || userResponse.toLowerCase().includes('don\'t know')) {
          return "I understand you might be unsure. Let's try a different approach - can you tell me about any products or services you've worked with before?";
        } else if (userResponse.toLowerCase().includes('cost') || userResponse.toLowerCase().includes('price')) {
          return "That's a great point about cost. How would you demonstrate the value and ROI of your solution to justify the investment?";
        } else if (userResponse.toLowerCase().includes('time') || userResponse.toLowerCase().includes('timeline')) {
          return "Timeline is important. How would you handle objections about implementation time and ensure a smooth transition?";
        } else {
          return "That's interesting. Can you elaborate on how you would handle potential objections from customers?";
        }
      }
    } catch (error) {
      console.error('Error generating AI question:', error);
      // Context-aware fallback
      const lastUserMessage = conversationHistory.filter(msg => msg.type === 'user').pop();
      const userResponse = lastUserMessage?.content || '';
      
      if (userResponse.toLowerCase().includes('no idea') || userResponse.toLowerCase().includes('don\'t know')) {
        return "I understand you might be unsure. Let's try a different approach - can you tell me about any products or services you've worked with before?";
      } else {
        return "That's interesting. Can you elaborate on how you would handle potential objections from customers?";
      }
    }
  }, [conversationHistory]);

  // Handle user voice response
  const handleVoiceResponse = useCallback(async (voiceTranscription) => {
    if (!voiceTranscription.trim() || isGeneratingResponse || isConversationComplete || isProcessingResponse) {
      console.log('Skipping voice response - conditions not met');
      return;
    }

    console.log('Processing voice response for step:', conversationStep);
    console.log('Transcription:', voiceTranscription);

    // Set processing flag to prevent duplicate processing
    setIsProcessingResponse(true);

    // Clear previous transcription immediately to prevent re-processing
    setLastTranscription(voiceTranscription);
    
    // Add a small delay to ensure transcription is cleared
    await new Promise(resolve => setTimeout(resolve, 200));

    // Add user response to conversation with unique ID
    const userMessage = {
      id: Date.now() + Math.random(), // More unique ID
      type: 'user',
      content: voiceTranscription,
      timestamp: new Date(),
      step: conversationStep
    };

    setConversationHistory(prev => [...prev, userMessage]);
    setIsGeneratingResponse(true);

    try {
      // Check if this is the last step
      if (conversationStep >= 2) {
        // Complete the conversation
        const thankYouMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "Thank you for the great conversation! You've demonstrated excellent sales skills. The role-play is now complete.",
          timestamp: new Date(),
          step: conversationStep
        };

        setConversationHistory(prev => [...prev, thankYouMessage]);
        setIsConversationComplete(true);
        
        // Speak completion message
        if (typeof onSpeakText === 'function') {
          onSpeakText(thankYouMessage.content);
        } else {
          // If no TTS service available, just log and continue
          console.log('⚠️ [TTS] No TTS service available, skipping speech for completion message');
          onToggleAISpeaking(false);
        }
      } else {
        // Generate next question
        const nextStep = conversationStep + 1;
        const nextQuestion = await generateStepQuestion(nextStep, currentScenario);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: nextQuestion,
          timestamp: new Date(),
          step: nextStep
        };

        setConversationHistory(prev => [...prev, aiMessage]);
        setConversationStep(nextStep);
        
        // Speak AI response
        if (typeof onSpeakText === 'function') {
          onSpeakText(nextQuestion);
        } else {
          // If no TTS service available, just log and continue
          console.log('⚠️ [TTS] No TTS service available, skipping speech for AI response');
          onToggleAISpeaking(false);
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your response. Could you please try again?",
        timestamp: new Date(),
        step: conversationStep
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingResponse(false);
      setIsProcessingResponse(false);
    }
  }, [isGeneratingResponse, isConversationComplete, isRecording, onStopRecording, conversationStep, currentScenario, generateStepQuestion, onSpeakText]);

  // Initialize scenario when question changes
  useEffect(() => {
    if (currentQuestion) {
      initializeSalesScenario();
    }
  }, [currentQuestion, initializeSalesScenario]);

  // Handle voice transcription - DISABLED AUTOMATIC PROCESSING
  // Now only manual processing via "Process Response" button
  useEffect(() => {
    // Just update lastTranscription when new transcription comes in
    if (transcription && transcription !== lastTranscription && transcription.length > 10) {
      console.log('New transcription received:', transcription);
      setLastTranscription(transcription);
    }
  }, [transcription, lastTranscription]);

  // Auto-start listening when AI finishes speaking - ONLY for next question
  useEffect(() => {
    if (!isAISpeaking && 
        !isGeneratingResponse && 
        !isConversationComplete && 
        !isRecording && 
        !isProcessingResponse &&
        conversationHistory.length > 0 &&
        conversationStep < 3) { // Only auto-start for steps 0, 1, 2
      const timer = setTimeout(() => {
        if (!isRecording && !isGeneratingResponse && !isProcessingResponse && !isConversationComplete) {
          console.log('Auto-starting recording for next question');
          // Clear previous transcription completely
          setLastTranscription('');
          if (onClearTranscription) {
            onClearTranscription();
          }
          // Start recording
          onStartRecording();
          setIsListening(true);
        }
      }, 2000); // Wait for AI to finish speaking
      return () => clearTimeout(timer);
    }
  }, [isAISpeaking, isGeneratingResponse, isConversationComplete, isRecording, isProcessingResponse, onStartRecording, onClearTranscription, conversationHistory.length, conversationStep]);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, scrollToBottom]);

  const handleSkipQuestion = () => {
    onNextQuestion();
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 0:
        return <Users className="h-4 w-4" />;
      case 1:
        return <Target className="h-4 w-4" />;
      case 2:
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (!currentScenario) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up sales scenario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sales Role-Play: {currentScenario.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customer: {currentScenario.customerProfile.name} - {currentScenario.customerProfile.title}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <button
              onClick={handleSkipQuestion}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Skip
            </button>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mt-3">
          {['Question 1', 'Question 2', 'Question 3', 'Complete'].map((step, index) => (
            <div key={step} className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                conversationStep === index 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : conversationStep > index
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {conversationStep > index ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span>{step}</span>
              </div>
              {index < 3 && (
                <div className="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {message.type === 'ai' && getStepIcon(message.step)}
                <span className="text-xs opacity-75">
                  {message.type === 'user' ? 'You' : currentScenario.customerProfile.name}
                </span>
                <span className="text-xs opacity-50">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isGeneratingResponse && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentScenario.customerProfile.name} is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={conversationEndRef} />
      </div>

      {/* Voice Recording Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        {isConversationComplete ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Role-play Complete!</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Thank you for participating in the sales role-play. Click "Next Question" to continue.
            </p>
            <div className="mt-4">
              <button
                onClick={onNextQuestion}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Next Question
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex flex-col items-center space-y-4">
              {isGeneratingResponse ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    Processing your response and generating next question...
                  </span>
                </div>
              ) : isRecording ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 bg-red-500 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Listening to your response...
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Speak clearly and naturally
                    </p>
                  </div>
                  {transcription && transcription.length > 10 && (
                    <div className="max-w-2xl w-full">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">You said:</span> {transcription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : isAISpeaking ? (
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <VolumeX className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    {currentScenario?.customerProfile?.name || 'Customer'} is speaking...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <Mic className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Ready to listen
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The system will automatically start recording when ready
                    </p>
                    {conversationHistory.length > 1 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Previous answer cleared - ready for new response
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Manual Controls */}
            <div className="flex items-center justify-center space-x-4 mt-6">
              {!isGeneratingResponse && !isConversationComplete && (
                <button
                  onClick={() => {
                    if (isRecording) {
                      onStopRecording();
                    } else {
                      // Clear previous transcription before starting new recording
                      if (onClearTranscription) {
                        onClearTranscription();
                      }
                      setLastTranscription('');
                      onStartRecording();
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5 inline mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 inline mr-2" />
                      Start Recording
                    </>
                  )}
                </button>
              )}

              {/* Manual Process Response Button */}
              {transcription && transcription.length > 10 && !isRecording && !isGeneratingResponse && !isConversationComplete && (
                <button
                  onClick={() => handleVoiceResponse(transcription)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  <MessageSquare className="h-5 w-5 inline mr-2" />
                  Process Response
                </button>
              )}
              
              {isAISpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                >
                  <VolumeX className="h-5 w-5 inline mr-2" />
                  Stop AI Speaking
                </button>
              )}
            </div>

            {/* Debug Panel */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>Step: {conversationStep}</div>
                <div>History: {conversationHistory.length}</div>
                <div>Generating: {isGeneratingResponse ? 'Yes' : 'No'}</div>
                <div>Complete: {isConversationComplete ? 'Yes' : 'No'}</div>
                <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
                <div>AI Speaking: {isAISpeaking ? 'Yes' : 'No'}</div>
                <div>Processing: {isProcessingResponse ? 'Yes' : 'No'}</div>
                <div>Transcription: {transcription ? transcription.substring(0, 20) + '...' : 'None'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationalSalesRound;