import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Zap
} from 'lucide-react'

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hello! I\'m your AI Health Assistant. How can I help you today?' },
    { id: 2, type: 'bot', text: 'I can help you with symptom analysis, medication information, health recommendations, and connecting you with doctors.' }
  ])
  const [input, setInput] = useState('')

  const sendMessage = () => {
    if (!input.trim()) return
    
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input
    }
    
    const botResponse = {
      id: messages.length + 2,
      type: 'bot',
      text: getBotResponse(input)
    }
    
    setMessages([...messages, userMessage, botResponse])
    setInput('')
  }

  const getBotResponse = (input) => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('headache') || lowerInput.includes('fever')) {
      return 'For headache or fever, I recommend resting and staying hydrated. You can take paracetamol if needed. If symptoms persist for more than 3 days, please consult a doctor.'
    } else if (lowerInput.includes('cough') || lowerInput.includes('cold')) {
      return 'For cough and cold, drink warm fluids and get plenty of rest. You can use over-the-counter cough syrup. If you have difficulty breathing, seek medical attention immediately.'
    } else if (lowerInput.includes('appointment') || lowerInput.includes('doctor')) {
      return 'I can help you schedule an appointment with a doctor. Would you like me to connect you with our booking system?'
    } else {
      return 'I understand your concern. For accurate medical advice, I recommend consulting with a healthcare professional. Would you like me to help you find a suitable doctor?'
    }
  }

  const commonQueries = [
    'I have a headache',
    'Book doctor appointment',
    'Medication information',
    'First aid advice'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link 
          to="/services"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 bg-white px-4 py-2 rounded-full shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">AI Health Assistant</h1>
                  <p className="text-purple-100">Available 24/7 for your health queries</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/20 rounded-lg">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/20 rounded-lg">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="flex h-[600px]">
            {/* Sidebar */}
            <div className="w-1/4 border-r bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-purple-50 border">
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-purple-600" />
                    <span>Symptom Checker</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-purple-50 border">
                  <div className="flex items-center gap-3">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>Upload Reports</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-purple-50 border">
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-purple-600" />
                    <span>Download History</span>
                  </div>
                </button>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-gray-700 mb-4">Common Queries</h3>
                <div className="space-y-2">
                  {commonQueries.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(query)
                        setTimeout(() => sendMessage(), 100)
                      }}
                      className="w-full text-left p-3 text-sm bg-gray-100 hover:bg-purple-100 rounded-lg"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-3 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                        : 'bg-white text-gray-800 shadow'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="border-t p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Describe your symptoms or ask a health question..."
                    className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button 
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              icon: <MessageSquare className="w-8 h-8" />, 
              title: 'Instant Responses', 
              desc: 'Get AI-powered answers to your health questions within seconds, 24/7 availability.' 
            },
            { 
              icon: <Shield className="w-8 h-8" />, 
              title: 'Privacy First', 
              desc: 'Your conversations are encrypted and never shared with third parties.' 
            },
            { 
              icon: <TrendingUp className="w-8 h-8" />, 
              title: 'Smart Analysis', 
              desc: 'Advanced machine learning algorithms provide personalized health insights.' 
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow text-center">
              <div className="text-purple-600 flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AIAssistantPage