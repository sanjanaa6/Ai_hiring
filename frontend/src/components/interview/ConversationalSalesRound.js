import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Users, 
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Play,
  Pause
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  onNextQuestion,
  onSubmitAnswer,
  onToggleAISpeaking,
  candidateInfo,
  isDarkMode
}) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [isRolePlayActive, setIsRolePlayActive] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [conversationStep, setConversationStep] = useState(0); // 0, 1, 2 (3 steps total)
  const [userResponse, setUserResponse] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  
  const conversationEndRef = useRef(null);
  const speechSynthesis = useRef(null);

  useEffect(() => {
    if (currentQuestion) {
      initializeSalesScenario();
    }
  }, [currentQuestion]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSalesScenario = async () => {
    if (!currentQuestion) return;

    const scenario = {
      id: currentQuestion.id,
      title: currentQuestion.question,
      type: currentQuestion.type || 'role-play',
      context: generateSalesContext(currentQuestion),
      objectives: generateSalesObjectives(currentQuestion),
      customerProfile: generateCustomerProfile(currentQuestion)
    };

    setCurrentScenario(scenario);
    setConversationStep(0);
    setIsRolePlayActive(true);
    setIsConversationComplete(false);

    // Start the conversation with the first question
    const firstQuestion = generateStepQuestion(0, scenario);
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: firstQuestion,
      timestamp: new Date(),
      step: 0
    };

    setConversationHistory([welcomeMessage]);
  };

  const generateSalesContext = (question) => {
    const questionText = question.question.toLowerCase();
    
    if (questionText.includes('software') || questionText.includes('saas')) {
      return "You're selling our new CRM software to a mid-size company. The prospect is interested but has concerns about implementation and cost.";
    } else if (questionText.includes('product') || questionText.includes('service')) {
      return "You're presenting our premium consulting service to a potential client. They need to see clear ROI and value proposition.";
    } else if (questionText.includes('partnership') || questionText.includes('deal')) {
      return "You're negotiating a strategic partnership deal. The client is interested but wants better terms and conditions.";
    } else {
      return "You're in a sales meeting with a potential client. They're interested in your product but have some concerns to address.";
    }
  };

  const generateSalesObjectives = (question) => {
    return [
      "Build rapport and understand customer needs",
      "Present value proposition effectively",
      "Handle objections professionally",
      "Close the deal or secure next steps"
    ];
  };

  const generateCustomerProfile = (question) => {
    return {
      name: "Alex Johnson",
      title: "VP of Operations",
      company: "TechCorp Solutions",
      painPoints: ["Inefficient processes", "High operational costs", "Need for better analytics"],
      budget: "Mid-range",
      timeline: "3-6 months",
      decisionMakingStyle: "Analytical and data-driven"
    };
  };

  const generateStepQuestion = (step, scenario) => {
    switch (step) {
      case 0:
        return "I'm interested in learning more about your solution. Can you tell me how it would help our business?";
      case 1:
        return "That sounds interesting, but I'm concerned about the cost and implementation time. How do you handle pricing and what's the typical timeline for getting started?";
      case 2:
        return "I need to think about this and discuss with my team. What would be the next steps if we decide to move forward?";
      default:
        return "Thank you for your time. I'll be in touch soon.";
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    onToggleAISpeaking(false);
  };

  const speakText = (text) => {
    // Cancel any ongoing speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      onToggleAISpeaking(true);
    };

    utterance.onend = () => {
      onToggleAISpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      onToggleAISpeaking(false);
    };

    speechSynthesis.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleUserResponse = async () => {
    if (!userResponse.trim() || isGeneratingResponse || isConversationComplete) return;

    // Add user response to conversation
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userResponse,
      timestamp: new Date(),
      step: conversationStep
    };

    setConversationHistory(prev => [...prev, userMessage]);
    setIsGeneratingResponse(true);
    setIsWaitingForResponse(false);

    try {
      // Check if this is the last step (step 2)
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
      } else {
        // Generate next question for the conversation
        const nextStep = conversationStep + 1;
        const nextQuestion = generateStepQuestion(nextStep, currentScenario);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: nextQuestion,
          timestamp: new Date(),
          step: nextStep
        };

        setConversationHistory(prev => [...prev, aiMessage]);
        setConversationStep(nextStep);
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
      setUserResponse('');
    }
  };




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
              {message.feedback && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                  <strong>Feedback:</strong> {message.feedback}
                </div>
              )}
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

      {/* Input Area */}
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
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder={`Respond to ${currentScenario?.customerProfile?.name || 'the customer'}...`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
                disabled={isGeneratingResponse}
              />
            </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUserResponse}
              disabled={!userResponse.trim() || isGeneratingResponse}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`p-2 rounded-lg ${
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            {isAISpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                title="Stop AI speaking"
              >
                <VolumeX className="h-5 w-5" />
              </button>
            )}
          </div>
          </div>
        )}
        
        {/* Next Question Button - Only show when conversation is complete */}
        {isConversationComplete && (
          <div className="mt-4 text-center">
            <button
              onClick={onNextQuestion}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              Next Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationalSalesRound;
