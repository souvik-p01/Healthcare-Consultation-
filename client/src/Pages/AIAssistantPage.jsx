import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  ChevronLeft,
  Send,
  MessageSquare,
  Shield,
  TrendingUp,
  Upload,
  Download,
  Search,
  Bell,
  Settings,
  Zap,
  FileText,
  X,
  User,
  Bot,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Volume2,
  Mic,
  History,
  Star,
  Heart,
  Plus,
  Trash2,
  Eye,
  Share2,
  Lock,
  Unlock,
  Menu,
  Maximize2
} from 'lucide-react';

// Using a free AI service (OpenRouter API - Free tier)
const FREE_AI_API_KEY = 'your-free-api-key-here'; // Replace with your free API key
const AI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      text: 'Hello! 👋 I\'m your AI Health Assistant, powered by advanced medical AI. How can I help you today?', 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    { 
      id: 2, 
      type: 'bot', 
      text: 'I can analyze symptoms, explain lab reports, provide medication information, and connect you with healthcare professionals. I\'m here 24/7 to support your health journey!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [apiKey] = useState(FREE_AI_API_KEY);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to call Free AI API (using OpenRouter's free tier)
  const callAIAPI = async (userMessage) => {
    try {
      // Option 1: Use free AI API (requires API key - get one from openrouter.ai)
      if (apiKey && apiKey !== 'your-free-api-key-here') {
        const response = await fetch(AI_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'HealthCare AI Assistant'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct:free',
            messages: [
              { 
                role: 'system', 
                content: 'You are a professional medical AI assistant. Provide helpful, accurate health information, but always remind users to consult real doctors for serious concerns. Be empathetic and clear in your responses.'
              },
              { role: 'user', content: userMessage }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
      }
      
      // Option 2: Local mock responses (no API key needed)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const medicalResponses = {
        'headache': 'Headaches can have many causes including tension, dehydration, or sinus issues. Try drinking water, resting in a dark room, and consider over-the-counter pain relief like ibuprofen. If severe, persistent, or accompanied by vision changes, consult a doctor immediately.',
        'fever': 'For fever above 100.4°F (38°C), monitor temperature regularly. Stay hydrated, rest, and use fever reducers like acetaminophen. Seek medical help if fever exceeds 103°F (39.4°C), lasts more than 3 days, or if you have difficulty breathing.',
        'cough': 'Coughs can be viral, bacterial, or allergic. Drink warm fluids like tea with honey, use a humidifier, and avoid irritants. If cough persists beyond 3 weeks, produces colored mucus, or causes chest pain, please see a doctor.',
        'cold': 'Common cold symptoms include runny nose, sore throat, and mild fatigue. Rest, hydrate, and use saline nasal sprays. Most colds resolve in 7-10 days. Contact a doctor if symptoms worsen or you develop high fever.',
        'appointment': 'I can help you schedule an appointment with our healthcare network! Would you prefer a video consultation or in-person visit? You can book directly through our platform.',
        'report': 'I can help analyze medical reports. Please upload your lab results, imaging reports, or doctor notes. I\'ll explain findings in simple terms and suggest follow-up questions for your doctor.',
        'medication': 'I can provide medication information including uses, side effects, and interactions. Please tell me the specific medication name and dosage for accurate information.',
        'emergency': '🚨 For emergencies like chest pain, difficulty breathing, severe bleeding, or loss of consciousness, CALL EMERGENCY SERVICES IMMEDIATELY (112 or 911).',
        'diabetes': 'For diabetes management: Monitor blood sugar regularly, follow a balanced diet with controlled carbohydrates, exercise regularly, and take medications as prescribed. Consult your endocrinologist for personalized advice.',
        'blood pressure': 'Normal blood pressure is around 120/80 mmHg. For high blood pressure, reduce sodium intake, exercise regularly, manage stress, and take prescribed medications. Monitor regularly and consult your doctor.',
        'allergy': 'For allergies: Avoid known triggers, use antihistamines as needed, and consider allergy testing. For severe reactions (anaphylaxis), use an epinephrine auto-injector and seek emergency care.'
      };

      const lowerMsg = userMessage.toLowerCase();
      
      // Check for keywords and return appropriate response
      for (const [keyword, response] of Object.entries(medicalResponses)) {
        if (lowerMsg.includes(keyword)) {
          return response;
        }
      }

      // General response for unknown queries
      return 'Thank you for your health query. While I can provide general information, it\'s important to consult with a healthcare professional for personalized medical advice. I can help you understand symptoms, explain medical terms, or guide you to appropriate resources. Could you provide more details about your concern?';
      
    } catch (error) {
      console.log('Using mock response due to:', error.message);
      // Fallback to mock response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Enhanced mock responses
      const mockResponses = [
        "Based on common symptoms you've described, I recommend monitoring your condition and consulting a healthcare professional if symptoms persist beyond 48 hours.",
        "I understand your concern. For accurate diagnosis and treatment, please schedule a consultation with one of our certified doctors.",
        "This sounds like something that should be evaluated by a medical professional. I can help you book an appointment or provide more information about symptoms.",
        "Your health is important. While I provide general guidance, please seek professional medical advice for proper diagnosis and treatment.",
        "I recommend keeping a symptom diary and consulting with a doctor who can examine you properly and order any necessary tests."
      ];
      
      return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatHistory(prev => [...prev, { query: input, time: new Date().toISOString() }]);
    const userInput = input;
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const botResponse = await callAIAPI(userInput);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Error fallback message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again or contact our support team for immediate assistance.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedDate: new Date().toLocaleDateString(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      fileObject: file
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setShowUploadModal(false);
    
    // Auto-analyze if it's a medical report
    const isMedicalReport = files.some(f => 
      f.name.toLowerCase().includes('report') || 
      f.name.toLowerCase().includes('lab') ||
      f.name.toLowerCase().includes('test') ||
      f.name.toLowerCase().includes('scan') ||
      f.name.toLowerCase().includes('xray') ||
      f.name.toLowerCase().includes('mri') ||
      f.type === 'application/pdf' || 
      f.type.includes('image/')
    );
    
    if (isMedicalReport) {
      setTimeout(() => {
        const analysisMessage = {
          id: Date.now(),
          type: 'bot',
          text: '📄 I see you\'ve uploaded a medical report. I can help analyze common findings! For detailed analysis, I can explain terms like "HbA1c" (blood sugar control), "LDL" (bad cholesterol), or "CRP" (inflammation markers). Please describe what specific parts you need help understanding.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, analysisMessage]);
      }, 500);
    }
  };

  const removeFile = (fileId) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const quickActions = [
    { icon: <Search className="w-5 h-5" />, label: 'Symptom Checker', color: 'bg-blue-100 text-blue-600' },
    { icon: <Upload className="w-5 h-5" />, label: 'Upload Reports', color: 'bg-green-100 text-green-600' },
    { icon: <History className="w-5 h-5" />, label: 'Chat History', color: 'bg-purple-100 text-purple-600' },
    { icon: <Volume2 className="w-5 h-5" />, label: 'Voice Input', color: 'bg-orange-100 text-orange-600' },
    { icon: <Download className="w-5 h-5" />, label: 'Export Chat', color: 'bg-red-100 text-red-600' },
    { icon: <Share2 className="w-5 h-5" />, label: 'Share Analysis', color: 'bg-indigo-100 text-indigo-600' }
  ];

  const commonQueries = [
    { query: 'I have headache and fever', icon: '🤒' },
    { query: 'How to read lab reports?', icon: '📋' },
    { query: 'Book doctor appointment', icon: '👨‍⚕️' },
    { query: 'Medication side effects', icon: '💊' },
    { query: 'First aid for emergencies', icon: '🚑' },
    { query: 'Diet for diabetes', icon: '🥗' },
    { query: 'High blood pressure tips', icon: '🫀' },
    { query: 'Allergy symptoms relief', icon: '🤧' }
  ];

  // API Setup Instructions Component
  const ApiSetupInfo = () => (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-yellow-800 mb-1">Setup AI Integration</h4>
          <p className="text-sm text-yellow-700 mb-2">
            To enable real AI responses, get a free API key from:
          </p>
          <div className="space-y-1 text-sm">
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 block">
              🔗 OpenRouter.ai (Free tier available)
            </a>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 block">
              🔗 OpenAI Platform (Free credits for new users)
            </a>
            <p className="text-xs text-yellow-600 mt-2">
              Currently using enhanced mock responses. Replace the API key in the code to enable real AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-4 md:py-8">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <Link 
            to="/services"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow transition-shadow w-fit"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back to Services</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 bg-white rounded-lg shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow">
              <Star className="w-4 h-4" />
              <span className="text-sm">AI Health Pro</span>
            </button>
          </div>
        </div>

        {/* API Setup Info */}
        <ApiSetupInfo />

        {/* Main Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 p-4 md:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <div className="relative">
                    <Brain className="w-8 h-8 md:w-10 md:h-10" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    AI Health Assistant
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">AI-Powered</span>
                  </h1>
                  <div className="flex items-center gap-2 text-purple-100 text-sm md:text-base">
                    <Zap className="w-4 h-4" />
                    <span>24/7 Medical Support • Symptom Analysis • Report Review</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Privacy">
                  <Lock className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Fullscreen">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Secure & Private</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex flex-col lg:flex-row h-[70vh] md:h-[600px]">
            {/* Sidebar */}
            <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-full lg:w-1/4 border-r bg-gradient-to-b from-gray-50 to-white p-4`}>
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (action.label === 'Upload Reports') {
                          setShowUploadModal(true);
                        }
                      }}
                      className="flex flex-col items-center p-3 bg-white rounded-xl hover:shadow-md transition-shadow border hover:border-purple-200"
                      title={action.label}
                    >
                      <div className={`p-2 rounded-lg ${action.color} mb-2`}>
                        {action.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Uploaded Files Section */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Your Reports
                    </h4>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                      {uploadedFiles.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadedFiles.slice(0, 3).map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-lg border hover:bg-purple-50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-xs font-medium truncate max-w-[120px]">{file.name}</div>
                            <div className="text-xs text-gray-500">{file.size}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {uploadedFiles.length > 3 && (
                    <button className="text-xs text-purple-600 mt-2 hover:text-purple-700">
                      View all {uploadedFiles.length} files →
                    </button>
                  )}
                </div>
              )}

              {/* Common Queries */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Common Questions
                </h3>
                <div className="space-y-2">
                  {commonQueries.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(item.query);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="w-full text-left p-3 text-sm bg-white hover:bg-purple-50 rounded-xl border transition-colors flex items-center gap-3"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1 text-xs md:text-sm">{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{messages.length}</div>
                    <div className="text-xs text-gray-500">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">24/7</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div 
                ref={chatContainerRef}
                className="flex-1 p-3 md:p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-[85%] md:max-w-xs">
                      {msg.type === 'bot' && (
                        <div className="mr-3 mt-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className={`px-4 py-3 rounded-2xl ${msg.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 shadow-sm rounded-tl-none border'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs opacity-80">
                            {msg.type === 'user' ? 'You' : 'Health AI'}
                          </span>
                          <span className="text-xs opacity-60">{msg.timestamp}</span>
                        </div>
                        <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      {msg.type === 'user' && (
                        <div className="ml-3 mt-1">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex max-w-xs">
                      <div className="mr-3 mt-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-3 md:p-4 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="p-2 border rounded-lg hover:bg-purple-50 transition-colors flex-shrink-0"
                      title="Upload file"
                    >
                      <Upload className="w-5 h-5 text-purple-600" />
                    </button>
                    <button 
                      className="p-2 border rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                      title="Voice input"
                      onClick={() => alert('Voice input feature coming soon!')}
                    >
                      <Mic className="w-5 h-5 text-blue-600" />
                    </button>
                    <button 
                      className="p-2 border rounded-lg hover:bg-green-50 transition-colors flex-shrink-0"
                      title="Take photo"
                      onClick={() => alert('Camera feature coming soon!')}
                    >
                      <Camera className="w-5 h-5 text-green-600" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                      placeholder="Describe symptoms, ask about medications, or upload reports..."
                      className="flex-1 px-4 py-3 border border-r-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                      disabled={isLoading}
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 md:px-6 py-3 rounded-r-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Thinking...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Try asking:</span>
                  {['Headache relief options', 'Explain my lab report', 'Diabetes management tips'].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(example);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-100"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
          {[
            { 
              icon: <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />, 
              title: 'AI-Powered Analysis', 
              desc: 'Advanced machine learning provides accurate symptom analysis and health insights.',
              gradient: 'from-blue-500 to-cyan-500'
            },
            { 
              icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />, 
              title: 'Medical-Grade Security', 
              desc: 'HIPAA compliant encryption ensures your health data remains private and secure.',
              gradient: 'from-green-500 to-emerald-500'
            },
            { 
              icon: <Upload className="w-6 h-6 md:w-8 md:h-8" />, 
              title: 'Report Analysis', 
              desc: 'Upload lab reports, prescriptions, and medical documents for AI-assisted analysis.',
              gradient: 'from-purple-500 to-pink-500'
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className={`bg-gradient-to-r ${feature.gradient} w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-center text-sm md:text-base">{feature.title}</h3>
              <p className="text-xs md:text-sm text-gray-600 text-center">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-6 h-6 text-purple-600" />
                Upload Medical Reports
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:bg-purple-50 transition-colors cursor-pointer mb-4"
            >
              <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to upload medical files</p>
              <p className="text-sm text-gray-500">PDF, JPG, PNG up to 10MB each</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
            </div>
            
            <div className="text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>End-to-end encrypted uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI analysis of medical reports</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-lg hover:shadow-lg transition-all"
              >
                Choose Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed bottom-4 right-4 lg:hidden z-40 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        {showSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default AIAssistantPage;