import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, StopCircle, ArrowRight, Activity, Thermometer, ShieldAlert,
  AlertTriangle, Check, User, Heart, Star, Sparkles, FileText, ArrowLeft,
  ChevronRight, Volume2, Info, Calendar, Download, RefreshCw,
  Video, Phone, MapPin
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const SymptomCheckerWizard = ({ onClose }) => {
  const { api } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Intake, 2: Corrections, 3: Questions, 4: Vitals, 5: Summary, 6: Doctor Recommendations
  
  // Booking direct flow states
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [bookingType, setBookingType] = useState("video");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Intake State
  const [inputText, setInputText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [detectedLang, setDetectedLang] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [extractedSymptoms, setExtractedSymptoms] = useState([]);
  
  // Corrections State
  const [corrections, setCorrections] = useState([]);
  
  // Questions State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  // Additional Clinical Details
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [pregnancy, setPregnancy] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState("2 days");
  
  // Vitals State
  const [temperature, setTemperature] = useState("");
  const [pulse, setPulse] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");

  // Assessment Results
  const [clinicalReasoning, setClinicalReasoning] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [soapNote, setSoapNote] = useState(null);
  const [specialty, setSpecialty] = useState("");
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);

  // Languages list
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' }
  ];

  // Start symptom checker session
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const res = await api.post('/ai-symptom/start');
        if (res.success && res.data?.session) {
          setSessionId(res.data.session._id);
        }
      } catch (err) {
        toast.error("Failed to initialize AI symptom checker session");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Start voice recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          await submitIntake({ audio: base64Audio });
        };
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied or unavailable.");
      console.error(err);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      // Stop all tracks to release microphone
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Submit text or voice intake
  const submitIntake = async ({ audio = null } = {}) => {
    if (!audio && !inputText.trim()) {
      toast.warning("Please type your symptoms or record voice.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        language: selectedLang,
        text: audio ? null : inputText,
        audio: audio
      };

      const res = await api.post(`/ai-symptom/${sessionId}/process-input`, payload);
      if (res.success && res.data) {
        const { session, correctionsRequired, suggestions } = res.data;
        setOriginalText(session.voiceInput.transcript);
        setTranslatedText(session.voiceInput.translatedText);
        setDetectedLang(session.voiceInput.language);
        setExtractedSymptoms(session.symptoms);

        if (correctionsRequired && suggestions?.length > 0) {
          setCorrections(suggestions);
          setStep(2); // Go to corrections
        } else {
          await fetchQuestions();
        }
      }
    } catch (err) {
      toast.error("Failed to process symptom intake");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dynamic clinical questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ai-symptom/${sessionId}/questions`);
      if (res.success && res.data?.questions) {
        setQuestions(res.data.questions);
        if (res.data.questions.length > 0) {
          setStep(3); // Go to Q&A wizard
        } else {
          setStep(4); // Skip to vitals
        }
      }
    } catch (err) {
      toast.error("Failed to load follow-up questions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit corrections for low confidence input
  const applyCorrection = (word, correctedValue) => {
    setTranslatedText(prev => prev.replace(word, correctedValue));
    // Remove correction card
    setCorrections(prev => prev.filter(c => c.word !== word));
  };

  const handleNextCorrectionStep = async () => {
    // Standardize text changes and request questions
    await fetchQuestions();
  };

  // Handle Q&A selection
  const handleAnswerSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNextQuestion = () => {
    if (!answers[questions[currentQuestionIdx].id]) {
      toast.warning("Please choose an answer to proceed.");
      return;
    }
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setStep(4); // Vitals intake
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    } else {
      setStep(1); // Back to intake
    }
  };

  // Submit vitals & clinical details
  const submitVitals = async () => {
    if (!age || !gender || !duration) {
      toast.warning("Please enter your age, gender and symptom duration.");
      return;
    }

    try {
      setLoading(true);
      
      // Save questionnaire answers to database
      const answersPayload = Object.keys(answers).map(key => {
        const q = questions.find(item => item.id === key);
        return {
          question: q.question,
          answer: answers[key],
          stepType: q.isRedFlag ? 'additional' : 'secondary'
        };
      });

      await api.post(`/ai-symptom/${sessionId}/answers`, { answers: answersPayload });

      // Save additional clinical details
      const vitalsPayload = {
        age: parseInt(age),
        gender,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        pregnancy: pregnancy,
        medicalHistory: medicalHistory ? medicalHistory.split(',').map(h => h.trim()) : [],
        severity: parseInt(severity),
        duration,
        vitals: {
          temperature: temperature ? parseFloat(temperature) : null,
          pulse: pulse ? parseInt(pulse) : null,
          bloodPressure: {
            systolic: systolic ? parseInt(systolic) : null,
            diastolic: diastolic ? parseInt(diastolic) : null
          },
          oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null
        }
      };

      await api.post(`/ai-symptom/${sessionId}/vitals`, vitalsPayload);

      // Perform Clinical Assessment / Reasoning
      const reasoningRes = await api.post(`/ai-symptom/${sessionId}/reasoning`);
      if (reasoningRes.success && reasoningRes.data) {
        setClinicalReasoning(reasoningRes.data.session.clinicalReasoning);
        setRiskAssessment(reasoningRes.data.session.riskAssessment);
        setSoapNote(reasoningRes.data.session.soapNote);
        setSpecialty(reasoningRes.data.session.doctorRecommendation.specialty);
        setRecommendedDoctors(reasoningRes.data.doctors || []);
        setStep(5); // Summary screen
      }
    } catch (err) {
      toast.error("Failed to complete clinical reasoning assessment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = () => {
    if (!bookingDoctor) return;
    
    // Store appointment info for the payment page
    const info = {
      doctor: {
        id: bookingDoctor._id,
        name: bookingDoctor.fullName || `${bookingDoctor.firstName} ${bookingDoctor.lastName}`,
        price: bookingDoctor.consultationFee,
        specialty: bookingDoctor.specialization
      },
      date: bookingDate,
      time: bookingTime,
      type: bookingType
    };
    
    toast.success('Appointment booked successfully!');
    setBookingDoctor(null);
    navigate('/services/payment', { state: { appointmentInfo: info } });
  };

  // Format recording timer: MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row" style={{ maxHeight: 'calc(100vh - 60px)', minHeight: 0 }}>
      
      {/* Sidebar Progress Banner */}
      <div className="w-full md:w-72 bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 text-white p-8 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
              <Activity size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">AI Intake</h2>
              <p className="text-xs text-cyan-100">Structured Assessment</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { num: 1, label: "Intake Audio/Text" },
              { num: 2, label: "Medical Verification" },
              { num: 3, label: "Clinical Questions" },
              { num: 4, label: "Demographics & Vitals" },
              { num: 5, label: "Diagnostic Summary" },
              { num: 6, label: "Doctor Recommendations" }
            ].map((s) => {
              const isActive = step === s.num || (s.num === 2 && step === 2);
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold transition-all ${
                    isCompleted ? 'bg-white text-teal-600 border-white' : 
                    isActive ? 'bg-cyan-400 text-slate-900 border-cyan-400 shadow-lg shadow-cyan-400/30' : 
                    'border-cyan-100/30 text-cyan-100'
                  }`}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : s.num}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-cyan-100 bg-opacity-50'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-cyan-200 leading-relaxed bg-white bg-opacity-10 p-3 rounded-xl border border-white/10">
          🔒 HIPAA Secure Encrypted Intake Session. Data will only be shared with your selected consulting physician.
        </div>
      </div>

      {/* Main Flow Content Panel */}
      <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto bg-slate-50/50 min-h-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-teal-600 uppercase">
              Step {step} of 6
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {step === 1 && "Describe Your Symptoms"}
              {step === 2 && "Confirm Terminology"}
              {step === 3 && "Symptom Context & History"}
              {step === 4 && "Physical Vitals & Details"}
              {step === 5 && "Assessment Summary"}
              {step === 6 && "Consult a Doctor"}
            </h1>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 py-4 flex flex-col justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="animate-spin text-teal-600" size={40} />
              <p className="text-sm font-medium text-slate-500">AI Clinical Engine Analyzing inputs...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* STEP 1: INTAKE */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex gap-4 items-center">
                    <label className="text-sm font-semibold text-slate-600">Select Input Language:</label>
                    <select 
                      value={selectedLang} 
                      onChange={(e) => setSelectedLang(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Input modes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Voice Input Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[220px]">
                      <div className="text-center mb-4">
                        <h3 className="font-bold text-slate-700 text-sm">Voice Intake (Bhashini-powered)</h3>
                        <p className="text-xs text-slate-400 mt-1">Speak symptoms in your selected language</p>
                      </div>

                      {isRecording ? (
                        <button 
                          onClick={stopRecording} 
                          className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-200 flex items-center justify-center text-rose-500 hover:bg-rose-100 hover:scale-105 transition-all animate-pulse"
                        >
                          <StopCircle size={32} />
                        </button>
                      ) : (
                        <button 
                          onClick={startRecording}
                          className="w-20 h-20 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center text-teal-600 hover:bg-teal-100 hover:scale-105 transition-all"
                        >
                          <Mic size={32} />
                        </button>
                      )}

                      <div className="mt-4 text-center">
                        <span className="font-mono text-sm text-slate-500 font-semibold">
                          {isRecording ? formatTime(recordingTime) : "00:00"}
                        </span>
                        <p className="text-[10px] text-teal-600 font-medium mt-1">
                          {isRecording ? "Listening... click to stop" : "Click mic to start speaking"}
                        </p>
                      </div>
                    </div>

                    {/* Text Input Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                      <div className="w-full">
                        <h3 className="font-bold text-slate-700 text-sm mb-2">Text Ingestion</h3>
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Describe how you feel (e.g. fever, headache, body pain since last night)..."
                          className="w-full h-28 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                      </div>
                      <button 
                        onClick={() => submitIntake()} 
                        disabled={!inputText.trim()}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        Analyze Text <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CORRECTIONS */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
                    <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Low Transcript Confidence</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Bhashini detected your input containing non-standard medical terms. Please confirm or correct the suggestions below:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[280px] overflow-y-auto">
                    {corrections.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-400">Heard:</span>
                          <p className="font-bold text-slate-800 text-sm">"{item.word}"</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {item.corrections.map((corr, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => applyCorrection(item.word, corr)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 border border-slate-200 rounded-lg text-xs font-semibold transition-all"
                            >
                              Confirm "{corr}"
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <span className="text-xs text-slate-400 block mb-1">Resulting Translated Text:</span>
                    <p className="text-sm font-medium text-slate-700 italic">"{translatedText}"</p>
                  </div>

                  <button
                    onClick={handleNextCorrectionStep}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              )}

              {/* STEP 3: QUESTIONS */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex gap-3 text-teal-800">
                    <Sparkles size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Follow-up Questionnaire</h4>
                      <p className="text-xs text-teal-700">
                        Based on your primary symptoms, our clinical engine has generated a few context-specific questions.
                      </p>
                    </div>
                  </div>

                  {questions.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                        <span className="font-semibold text-teal-600">
                          {Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}% Complete
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-lg leading-snug">
                        {questions[currentQuestionIdx].question}
                      </h3>

                      <div className="grid grid-cols-1 gap-3">
                        {questions[currentQuestionIdx].options.map((opt, oIdx) => {
                          const isSelected = answers[questions[currentQuestionIdx].id] === opt;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleAnswerSelect(questions[currentQuestionIdx].id, opt)}
                              className={`w-full py-3 px-4 border rounded-xl text-sm font-medium text-left transition-all ${
                                isSelected 
                                  ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold shadow-sm' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handlePrevQuestion}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: VITALS & DEMOGRAPHICS */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Age *</label>
                      <input 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        placeholder="e.g. 35"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Gender *</label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Height (cm)</label>
                      <input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        placeholder="e.g. 175"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        placeholder="e.g. 70"
                      />
                    </div>
                  </div>

                  {gender === "female" && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="preg" 
                        checked={pregnancy} 
                        onChange={(e) => setPregnancy(e.target.checked)} 
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="preg" className="text-sm font-semibold text-slate-600">Are you currently pregnant?</label>
                    </div>
                  )}

                  {/* Vitals Form */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                      <Thermometer size={16} className="text-teal-600" /> Physical Vitals (Optional)
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Temp (°C)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={temperature} 
                          onChange={(e) => setTemperature(e.target.value)} 
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" 
                          placeholder="e.g. 37.2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Pulse (bpm)</label>
                        <input 
                          type="number" 
                          value={pulse} 
                          onChange={(e) => setPulse(e.target.value)} 
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" 
                          placeholder="e.g. 72"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">SpO2 (%)</label>
                        <input 
                          type="number" 
                          value={oxygenSaturation} 
                          onChange={(e) => setOxygenSaturation(e.target.value)} 
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" 
                          placeholder="e.g. 98"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">BP Systolic</label>
                        <input 
                          type="number" 
                          value={systolic} 
                          onChange={(e) => setSystolic(e.target.value)} 
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" 
                          placeholder="e.g. 120"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">BP Diastolic</label>
                        <input 
                          type="number" 
                          value={diastolic} 
                          onChange={(e) => setDiastolic(e.target.value)} 
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" 
                          placeholder="e.g. 80"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Pain Scale (1-10)</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={severity} 
                        onChange={(e) => setSeverity(e.target.value)} 
                        className="w-full accent-teal-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1 mt-1">
                        <span>Mild (1)</span>
                        <span>Severe (10)</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Duration *</label>
                      <input 
                        type="text" 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)} 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        placeholder="e.g. 3 days"
                      />
                    </div>
                  </div>

                  <button
                    onClick={submitVitals}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                  >
                    Run Clinical Assessment
                  </button>
                </div>
              )}

              {/* STEP 5: ASSESSMENT SUMMARY */}
              {step === 5 && (
                <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
                  
                  {/* Emergency Warning */}
                  {riskAssessment?.hasEmergencyBanner && (
                    <div className="bg-rose-50 border-l-4 border-rose-600 text-rose-900 p-4 rounded-xl space-y-2 animate-bounce">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <ShieldAlert className="text-rose-600" />
                        CRITICAL MEDICAL EMERGENCY DETECTED
                      </div>
                      <p className="text-xs leading-relaxed text-rose-700">
                        Your assessment indicates potential high-risk red flags. Please consult emergency services immediately or book a fast-track virtual consultation below.
                      </p>
                    </div>
                  )}

                  {/* Risk Level Badge */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Clinical Risk Rating</span>
                      <h4 className="font-extrabold text-slate-800 mt-0.5">
                        {riskAssessment?.level.toUpperCase()} RISK
                      </h4>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${
                      riskAssessment?.level === 'emergency' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                      riskAssessment?.level === 'high' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                      riskAssessment?.level === 'medium' ? 'bg-cyan-100 text-cyan-700 border-cyan-300' :
                      'bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}>
                      {riskAssessment?.level.toUpperCase()}
                    </div>
                  </div>

                  {/* Conditions & Probabilities */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 border-b pb-2">
                      <Sparkles size={16} className="text-teal-600" /> Possible Diagnoses & Probabilities
                    </h3>

                    <div className="space-y-4">
                      {clinicalReasoning.map((cond, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{cond.condition}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-semibold font-mono">ICD-11: {cond.icd11}</span>
                            <span className="font-bold text-teal-600">{cond.probability}% Probability</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" style={{ width: `${cond.probability}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms & SNOMED CT Codes */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 border-b pb-2">
                      <Info size={16} className="text-teal-600" /> Verified Clinical Symptoms (SNOMED CT)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedSymptoms.map((sym, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-2"
                        >
                          <Check size={12} className="text-teal-600" />
                          {sym.name} 
                          <span className="text-[9px] text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded font-mono font-bold">
                            SNOMED: {sym.somedCode}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SOAP Note Review */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 border-b pb-2">
                      <FileText size={16} className="text-teal-600" /> Preliminary SOAP Notes
                    </h3>
                    <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800 block">Subjective (S):</span>
                        <p className="mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">"{soapNote?.subjective}"</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Objective (O):</span>
                        <p className="mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">"{soapNote?.objective}"</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Assessment (A):</span>
                        <p className="mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">"{soapNote?.assessment}"</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Plan (P):</span>
                        <p className="mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">"{soapNote?.plan}"</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(6)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    View Recommended Doctors <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* STEP 6: DOCTOR RECOMMENDATIONS */}
              {step === 6 && (
                <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
                  <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4">
                    <h4 className="font-bold text-sm text-teal-800">Department Recommended: {specialty}</h4>
                    <p className="text-xs text-teal-700 mt-1">
                      Based on your primary symptom profile, we suggest consulting with these matching platform physicians.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {recommendedDoctors.length === 0 ? (
                      <div className="text-center py-10 bg-white border rounded-2xl text-slate-400 text-sm">
                        No doctors available matching the specialty "{specialty}". Please search General Medicine.
                      </div>
                    ) : (
                      recommendedDoctors.map((doc, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img 
                              src={doc.avatar || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"} 
                              alt={doc.fullName} 
                              className="w-14 h-14 rounded-full border border-slate-100 object-cover"
                            />
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">Dr. {doc.fullName || `${doc.firstName} ${doc.lastName}`}</h4>
                              <p className="text-xs text-teal-600 font-semibold">{doc.specialization}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">{doc.experience} Years Exp</span>
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">Fee: ₹{doc.consultationFee}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => setBookingDoctor(doc)}
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Calendar size={13} /> Book Consultation
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                  >
                    Finish Session
                  </button>

                  {/* direct booking modal overlay mirroring screenshot */}
                  {bookingDoctor && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Title Header */}
                        <div className="flex justify-between items-center pb-2 border-b">
                          <h3 className="font-extrabold text-slate-800 text-base">Book Appointment</h3>
                          <button 
                            onClick={() => setBookingDoctor(null)}
                            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Doctor Row */}
                        <div className="flex items-center gap-3">
                          <img 
                            src={bookingDoctor.avatar || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"} 
                            alt={bookingDoctor.fullName} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-100"
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Dr. {bookingDoctor.fullName || `${bookingDoctor.firstName} ${bookingDoctor.lastName}`}</h4>
                            <p className="text-xs text-blue-600 font-semibold">{bookingDoctor.specialization}</p>
                          </div>
                        </div>

                        {/* Select Date */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Select Date
                          </label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium text-slate-700 bg-white"
                          />
                        </div>

                        {/* Select Time Slot */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Select Time Slot
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((time) => {
                              const isSelected = bookingTime === time;
                              return (
                                <button
                                  key={time}
                                  onClick={() => setBookingTime(time)}
                                  className={`py-2 border rounded-lg text-xs font-semibold text-center transition-all ${
                                    isSelected 
                                      ? 'border-black bg-slate-50 text-slate-900 ring-1 ring-black' 
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Consultation Type */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Consultation Type
                          </label>
                          <div className="flex gap-2">
                            {[
                              { type: 'video', label1: 'Video', label2: 'Consultation', icon: <Video size={14} /> },
                              { type: 'phone', label1: 'Phone', label2: 'Consultation', icon: <Phone size={14} /> },
                              { type: 'in-person', label1: 'In-person', label2: 'Visit', icon: <MapPin size={14} /> }
                            ].map((typeItem) => {
                              const isSelected = bookingType === typeItem.type;
                              return (
                                <button
                                  key={typeItem.type}
                                  onClick={() => setBookingType(typeItem.type)}
                                  className={`flex-1 flex flex-row items-center justify-center gap-1.5 p-2.5 border rounded-lg transition-all ${
                                    isSelected 
                                      ? 'border-black bg-slate-50 text-slate-800 font-semibold ring-1 ring-black' 
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="text-slate-500">{typeItem.icon}</div>
                                  <div className="text-[9px] leading-tight text-left">
                                    <div>{typeItem.label1}</div>
                                    <div>{typeItem.label2}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setBookingDoctor(null)}
                            className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg hover:bg-slate-50 font-semibold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmBooking}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-95 text-white py-2.5 rounded-lg font-bold text-xs shadow-sm transition-all"
                          >
                            Confirm Booking
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerWizard;
