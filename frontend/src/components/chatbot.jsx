import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Chatbot({ detectionResult }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When detection result changes, generate an initial message
  useEffect(() => {
    if (detectionResult) {
      const tumorType = detectionResult.tumor;
      const confidence = detectionResult.confidence;
      
      // Reset chat when new scan is analyzed
      setMessages([]);
      
      // Add system message about the detection
      setMessages(prevMessages => [
        ...prevMessages,
        {
          type: 'system',
          text: `Brain scan analyzed. ${tumorType} detected with ${confidence}% confidence.`,
          timestamp: new Date()
        }
      ]);
      
      // Automatically ask for information about the detected condition
      handleAutomaticQuery(tumorType, confidence, detectionResult.probabilities);
    }
  }, [detectionResult]);

  const handleAutomaticQuery = async (tumorType, confidence, probabilities) => {
    let initialQuery;
    
    if (tumorType === 'No Tumor') {
      initialQuery = "The scan shows no tumor. What are some good brain health practices and when should someone consider getting a brain scan?";
    } else {
      initialQuery = `The scan shows a ${tumorType} with ${confidence}% confidence. Please provide information about this type of brain tumor including common symptoms, treatment options, and prognosis.`;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/chatbot/', {
        message: initialQuery,
        context: {
          tumor_type: tumorType,
          confidence: confidence,
          probabilities: probabilities,
          is_automatic_query: true
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data && response.data.reply) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            type: 'assistant',
            text: response.data.reply,
            timestamp: new Date()
          }
        ]);
      } else {
        console.error('Invalid response format');
        setError('Received an invalid response from the server');
      }
    } catch (err) {
      console.error('Chatbot API error:', err);
      setError('Failed to fetch initial information. Please try asking a question.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setLoading(true);
    setError('');
    
    // Prepare context from detection result if available
    const context = detectionResult ? {
      tumor_type: detectionResult.tumor,
      confidence: detectionResult.confidence,
      probabilities: detectionResult.probabilities
    } : {};
    
    try {
      const response = await axios.post('/api/chatbot/', {
        message: input,
        context: context
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data && response.data.reply) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            type: 'assistant',
            text: response.data.reply,
            timestamp: new Date()
          }
        ]);
      } else {
        setError('Received an invalid response format');
      }
    } catch (err) {
      console.error('Chatbot API error:', err);
      
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data.error || 'Unknown error'}`);
      } else if (err.request) {
        setError('Unable to reach the server. Please check your connection.');
      } else {
        setError('Sorry, something went wrong.');
      }
    } finally {
      setLoading(false);
    }
    
    // Clear input after submission
    setInput('');
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format response text to preserve newlines
  const formatResponseText = (text) => {
    // Split text by newlines and map each line to a paragraph element
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-1">{line || "\u00A0"}</p>
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Brain Tumor Assistant</h2>
      
      <div className="flex-1 overflow-y-auto mb-4 max-h-[500px] border border-gray-200 rounded-lg p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="mt-2">
              {detectionResult ? 'Analyzing your scan results...' : 'Upload a brain scan to begin'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Welcome message */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 bg-blue-100 p-3 rounded-lg rounded-tl-none max-w-[75%]">
                <p className="text-sm font-medium text-gray-900">Brain Tumor Assistant</p>
                <p className="text-sm text-gray-700">
                  Welcome! I'm here to help answer your questions about brain tumors and your scan results.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(new Date())}
                </p>
              </div>
            </div>
            
            {/* Chat messages */}
            {messages.map((message, index) => {
              if (message.type === 'system') {
                return (
                  <div key={index} className="flex justify-center">
                    <div className="bg-gray-200 px-4 py-2 rounded-full text-xs text-gray-700">
                      {message.text}
                    </div>
                  </div>
                );
              } else if (message.type === 'user') {
                return (
                  <div key={index} className="flex items-start justify-end">
                    <div className="mr-3 bg-blue-500 p-3 rounded-lg rounded-tr-none max-w-[75%]">
                      <p className="text-sm text-white">{message.text}</p>
                      <p className="text-xs text-blue-100 mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 bg-blue-100 p-3 rounded-lg rounded-tl-none max-w-[75%]">
                      <p className="text-sm font-medium text-gray-900">Brain Tumor Assistant</p>
                      <div className="text-sm text-gray-700">
                        {formatResponseText(message.text)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              }
            })}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 bg-blue-100 p-3 rounded-lg rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 border rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your scan results or brain tumors..."
          className="flex-1 border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading || !detectionResult}
        />
        <button
          type="submit"
          className={`px-4 text-white rounded-xl transition ${
            loading || !input.trim() || !detectionResult ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={loading || !input.trim() || !detectionResult}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        This assistant provides general information only and is not a substitute for professional medical advice.
        Always consult with healthcare professionals for medical concerns.
      </div>
    </div>
  );
}