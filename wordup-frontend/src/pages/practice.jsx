import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAIFeedback } from "../services/aiFeedback";
import { synthesizeSpeech, lookupPronunciation } from "../services/pronunciation";
import Header from "../components/Header";

export default function Practice() {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speechId, setSpeechId] = useState(null);
  const [speechContent, setSpeechContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [ttsInput, setTtsInput] = useState("");
  const [ttsAudioUrl, setTtsAudioUrl] = useState("");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [pronunciationWord, setPronunciationWord] = useState("");
  const [pronunciationResult, setPronunciationResult] = useState(null);
  const [pronunciationLoading, setPronunciationLoading] = useState(false);
  const [pronunciationError, setPronunciationError] = useState("");
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const restartTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginPrompt(true);
    } else {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const loadSpeechContent = async () => {
      if (location.state?.speechId) {
        setSpeechId(location.state.speechId);
        
        if (location.state.preloadedSpeech) {
          setSpeechContent({
            text: location.state.preloadedSpeech,
            title: location.state.title || "Your Speech"
          });
        } else {
          try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/speech/${location.state.speechId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
              setSpeechContent({
                text: data.speech.improvedVersion || data.speech.originalDraft,
                title: data.speech.title
              });
            }
          } catch (error) {
            console.error('Failed to load speech:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    loadSpeechContent();
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  // Enhanced filler word detection
  const detectFillerWords = (text) => {
    const fillerPatterns = [
      /\b(um+|uh+|uhm+|umh+|uhh+|uhm+h*|uh+m+)\b/gi,  // um, uh, uhm, umh, uhh, uhhh, etc.
      /\b(er+|erm+|err+)\b/gi,                         // er, erm, err
      /\b(ah+|ahh+)\b/gi,                              // ah, ahh
      /\b(like)\b/gi,                                  // like
      /\b(you know)\b/gi,                              // you know
      /\b(basically)\b/gi,                             // basically
      /\b(actually)\b/gi,                              // actually
      /\b(literally)\b/gi,                             // literally
      /\b(sort of|kind of)\b/gi,                       // sort of, kind of
      /\b(i mean)\b/gi,                                // I mean
      /\b(you see)\b/gi,                               // you see
      /\b(right\?)\b/gi,                               // right?
      /\b(okay|ok)\b/gi,                               // okay, ok
      /\b(so+)\b/gi,                                   // so, sooo
      /\b(well+)\b/gi,                                 // well
      /\b(just)\b/gi,                                  // just
      /\b(really)\b/gi,                                // really
      /\b(very)\b/gi,                                  // very
      /\b(honestly)\b/gi,                              // honestly
      /\b(obviously)\b/gi,                             // obviously
      /\b(essentially)\b/gi,                           // essentially
      /\b(you know what i mean)\b/gi,                  // you know what I mean
      /\b(i guess)\b/gi,                               // I guess
      /\b(i think)\b/gi,                               // I think (when overused)
      /\b(maybe)\b/gi,                                 // maybe (when overused)
      /\b(stuff|things)\b/gi                           // stuff, things (when vague)
    ];
    
    let totalFillers = 0;
    const fillerDetails = {};
    
    fillerPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalized = match.toLowerCase().trim();
          if (fillerDetails[normalized]) {
            fillerDetails[normalized]++;
          } else {
            fillerDetails[normalized] = 1;
          }
          totalFillers++;
        });
      }
    });
    
    return { 
      count: totalFillers, 
      details: Object.entries(fillerDetails).map(([word, count]) => ({ word, count }))
    };
  };

  // Auto-save attempt for comparison tracking (session only)
  const autoSaveAttempt = (transcriptText, feedbackData, duration) => {
    const fillerAnalysis = detectFillerWords(transcriptText);
    const words = transcriptText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const score = feedbackData?.overallScore || calculateBasicScore(transcriptText, fillerAnalysis.count, wordCount);

    const newAttempt = {
      attemptNumber: attempts.length + 1,
      transcript: transcriptText,
      feedback: feedbackData,
      score,
      timestamp: new Date().toISOString(),
      wordCount,
      fillerCount: fillerAnalysis.count,
      fillerDetails: fillerAnalysis.details,
      sentenceCount: sentences.length,
      duration: duration || 0
    };
    
    setAttempts([...attempts, newAttempt]);
    setCurrentAttempt(newAttempt);
  };

  // Calculate basic score if AI feedback fails
  const calculateBasicScore = (text, fillerCount, wordCount) => {
    let score = 70; // Base score
    
    // Deduct for filler words (max -30 points)
    const fillerRatio = fillerCount / Math.max(wordCount, 1);
    score -= Math.min(fillerRatio * 100, 30);
    
    // Add points for good length (50-200 words is ideal)
    if (wordCount >= 50 && wordCount <= 200) {
      score += 10;
    } else if (wordCount < 30) {
      score -= 15;
    }
    
    // Add points for sentence variety
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Save to database (for dashboard/saved speeches)
  const savePracticeSession = async (transcriptText, feedbackData, scoreValue) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;

      setIsSaving(true);
      setSaveMessage("");

      const fillerAnalysis = detectFillerWords(transcriptText);
      const words = transcriptText.trim().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const score = feedbackData?.overallScore || scoreValue || calculateBasicScore(transcriptText, fillerAnalysis.count, wordCount);

      const response = await fetch('http://localhost:5000/api/practice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          speechId: speechId,
          transcript: transcriptText,
          score,
          wordCount,
          fillerWordCount: fillerAnalysis.count,
          sentenceCount: sentences.length,
          feedback: JSON.stringify(feedbackData),
          duration: currentAttempt?.duration || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage("✅ Session saved to dashboard successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("❌ Failed to save session");
      }

    } catch (error) {
      console.error('Failed to save practice session:', error);
      setSaveMessage("❌ Error saving session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    setTranscript("");
    setInterimTranscript("");
    setFeedback(null);
    setCurrentAttempt(null);
    setSaveMessage("");
    finalTranscriptRef.current = "";
    // Don't reset attempts or showComparison - keep the history
  };

  const getScoreImprovement = () => {
    if (attempts.length < 2) return null;
    const latest = attempts[attempts.length - 1].score;
    const previous = attempts[attempts.length - 2].score;
    return latest - previous;
  };

  const startRecording = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("⚠️ Speech recognition not supported. Use Chrome, Edge, or Safari.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives for better filler detection

    // Track when recording started
    setRecordingStartTime(Date.now());
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setFeedback(null);
    setSaveMessage("");

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      
      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        let bestTranscript = result[0].transcript;
        
        // Check alternatives for better filler word detection
        if (result.length > 1) {
          for (let j = 0; j < result.length; j++) {
            const alt = result[j].transcript.toLowerCase();
            // Prioritize alternatives that contain filler words
            if (alt.includes('um') || alt.includes('uh') || alt.includes('er') || 
                alt.includes('ah') || alt.includes('like') || alt.includes('you know')) {
              bestTranscript = result[j].transcript;
              break;
            }
          }
        }
        
        if (result.isFinal) {
          // Add final results to our accumulated transcript
          finalTranscriptRef.current += bestTranscript + ' ';
          setTranscript(finalTranscriptRef.current);
          console.log('Final transcript chunk:', bestTranscript);
        } else {
          // Show interim results
          interim += bestTranscript;
        }
      }
      
      setInterimTranscript(interim);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Recognition error:", event.error);
      
      // Don't alert for common errors, just log them
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
      } else if (event.error === 'audio-capture') {
        alert("⚠️ Microphone error. Please check your microphone permissions.");
        setIsListening(false);
      } else if (event.error === 'not-allowed') {
        alert("⚠️ Microphone access denied. Please allow microphone access.");
        setIsListening(false);
      } else {
        console.log(`Recognition error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      console.log('Recognition ended');
      
      // If we're still supposed to be listening, restart
      if (isListening && recognitionRef.current) {
        console.log('Restarting recognition...');
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
          setIsListening(false);
        }
      }
    };

    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('Recognition started');
    } catch (error) {
      console.error('Error starting recognition:', error);
      alert("⚠️ Could not start speech recognition. Please try again.");
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Calculate duration
    const duration = recordingStartTime ? Math.round((Date.now() - recordingStartTime) / 1000) : 0;
    
    // Get the final transcript from ref
    const finalFromRef = finalTranscriptRef.current.trim();
    
    // Also check current state (which includes interim results that might not be finalized yet)
    const currentTranscript = transcript.trim();
    const currentInterim = interimTranscript.trim();
    const combinedFromState = (currentTranscript + ' ' + currentInterim).trim();
    
    // Use the best available transcript: prefer final ref, but fall back to state if ref is empty
    // This handles cases where user stops before interim results are finalized
    const finalText = finalFromRef || combinedFromState;
    
    console.log('Final accumulated transcript (ref):', finalFromRef);
    console.log('Current transcript (state):', currentTranscript);
    console.log('Current interim (state):', currentInterim);
    console.log('Combined from state:', combinedFromState);
    console.log('Using final text:', finalText);
    console.log('Word count:', finalText.split(/\s+/).filter(w => w).length);
    
    if (finalText && finalText.length > 0) {
      setTranscript(finalText);
      setInterimTranscript("");
      // Update the ref as well for consistency
      finalTranscriptRef.current = finalText;
      analyzeSpeech(finalText, duration);
    } else {
      alert("⚠️ No speech detected. Please try again and speak clearly.");
    }
  };

  const analyzeSpeech = async (text, duration = 0) => {
    if (!text || text.trim().length === 0) {
      alert("⚠️ No speech detected.");
      return;
    }

    console.log('Analyzing speech:', text);
    console.log('Text length:', text.length);
    console.log('Word count:', text.split(/\s+/).filter(w => w).length);

    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const result = await getAIFeedback(text);

      if (result.success && result.structured) {
        setFeedback(result.data);
        // Auto-save this attempt for comparison
        autoSaveAttempt(text, result.data, duration);
      } else if (result.success) {
        const fillerAnalysis = detectFillerWords(text);
        const words = text.split(/\s+/).filter(w => w);
        const fallbackFeedback = { 
          rawFeedback: result.feedback,
          overallScore: calculateBasicScore(text, fillerAnalysis.count, words.length)
        };
        setFeedback(fallbackFeedback);
        // Auto-save this attempt even with raw feedback
        autoSaveAttempt(text, fallbackFeedback, duration);
      } else {
        // Fallback: create basic feedback
        const words = text.split(/\s+/).filter(w => w);
        const fillerAnalysis = detectFillerWords(text);
        const score = calculateBasicScore(text, fillerAnalysis.count, words.length);
        
        const basicFeedback = {
          overallScore: score,
          stats: {
            wordCount: words.length,
            sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
            fillerWordCount: fillerAnalysis.count,
            wordsPerMinute: duration > 0 ? Math.round((words.length / duration) * 60) : 0
          },
          rawFeedback: `Speech analyzed locally.\n\nWord Count: ${words.length}\nFiller Words: ${fillerAnalysis.count}\nScore: ${score}/100`
        };
        
        setFeedback(basicFeedback);
        autoSaveAttempt(text, basicFeedback, duration);
      }

    } catch (error) {
      console.error("Analysis error:", error);
      
      // Provide basic feedback even on error
      const words = text.split(/\s+/).filter(w => w);
      const fillerAnalysis = detectFillerWords(text);
      const score = calculateBasicScore(text, fillerAnalysis.count, words.length);
      
      const basicFeedback = {
        overallScore: score,
        stats: {
          wordCount: words.length,
          sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
          fillerWordCount: fillerAnalysis.count,
          wordsPerMinute: duration > 0 ? Math.round((words.length / duration) * 60) : 0
        },
        rawFeedback: `Analysis error occurred. Basic metrics:\n\nWord Count: ${words.length}\nFiller Words: ${fillerAnalysis.count}\nScore: ${score}/100`
      };
      
      setFeedback(basicFeedback);
      autoSaveAttempt(text, basicFeedback, duration);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Needs Work";
    if (score >= 50) return "Below Average";
    return "Poor";
  };

  const handleSynthesizeSpeech = async () => {
    if (!ttsInput.trim()) {
      setTtsError("Enter some text to synthesize.");
      return;
    }

    try {
      setTtsLoading(true);
      setTtsError("");
      const audioUrl = await synthesizeSpeech(ttsInput);
      setTtsAudioUrl(audioUrl);
    } catch (error) {
      setTtsError(error.message || "Failed to synthesize speech.");
      setTtsAudioUrl("");
    } finally {
      setTtsLoading(false);
    }
  };

  const handlePronunciationLookup = async () => {
    if (!pronunciationWord.trim()) {
      setPronunciationError("Enter a word to check pronunciation.");
      return;
    }

    try {
      setPronunciationLoading(true);
      setPronunciationError("");
      const result = await lookupPronunciation(pronunciationWord.trim());
      setPronunciationResult(result);
    } catch (error) {
      setPronunciationError(error.message || "Unable to find pronunciation.");
      setPronunciationResult(null);
    } finally {
      setPronunciationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <Header currentPage="Practice" />

      {/* Navigation Buttons */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-semibold shadow-lg border border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <button
            onClick={() => navigate('/speeches')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            Saved Speeches
          </button>
        </div>
      </div>

      {showLoginPrompt && !isLoggedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600">You need to log in first to access the Practice feature.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/login")} className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-full hover:from-purple-700 hover:to-violet-700 transition font-bold">
                Login
              </button>
              <button onClick={() => navigate("/")} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-full hover:bg-gray-200 transition font-bold">
                Go Home
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")} className="text-purple-600 hover:text-purple-700 font-semibold">
                Register here
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-white mb-3">
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                WordUP Coach
              </span>
            </h1>
            <p className="text-gray-300 text-lg">Practice your speech and get strict AI-powered feedback</p>
          </div>

          {speechContent && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl shadow-2xl p-8 mb-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-2xl font-black text-gray-900">📜 Enhanced Script</h3>
                <span className="ml-auto px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold">
                  Read This
                </span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-inner border border-purple-100">
                <h4 className="text-lg font-bold text-purple-600 mb-3">{speechContent.title}</h4>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                  {speechContent.text}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-medium">
                    📊 Word count: <span className="text-purple-600 font-bold">{speechContent.text.trim().split(/\s+/).length}</span> words
                  </p>
                </div>
              </div>
              <p className="text-center text-purple-600 font-semibold mt-4 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Read this script out loud when you're ready to practice
              </p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="flex flex-col items-center gap-6">
              
              <div className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse shadow-lg"
                  : "bg-gray-100 text-gray-600"
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  {isListening ? "🎤 Listening..." : "Ready to record"}
                </div>
              </div>

              {isListening && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    💡 Tip: Speak clearly and at a natural pace
                  </p>
                  <p className="text-xs text-gray-400">
                    Recording will capture everything you say until you click Stop
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={startRecording}
                  disabled={isListening || !isLoggedIn}
                  className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-xl hover:from-green-600 hover:to-emerald-600 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items -center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Speaking
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!isListening}
                  className="px-10 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-xl hover:from-red-600 hover:to-pink-600 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop & Analyze
                </button>
              </div>

              {isListening && (
                <p className="text-purple-600 font-bold animate-pulse flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Speak now... I'm listening!
                </p>
              )}

              {isAnalyzing && (
                <p className="text-blue-600 font-bold flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI is analyzing your speech...
                </p>
              )}

              {saveMessage && (
                <p className={`text-sm font-semibold ${saveMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}

              {isSaving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Saving to dashboard...</span>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-purple-600">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Loading speech...</span>
                </div>
              )}
            </div>

            {(transcript || interimTranscript) && (
              <div className="mt-8">
                <h3 className="text-xl font-black text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Your Transcript
                  {isListening && (
                    <span className="ml-auto px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </h3>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl text-gray-700 shadow-inner border border-gray-200 min-h-[100px]">
                  <span>{transcript}</span>
                  {interimTranscript && (
                    <span className="text-gray-400 italic animate-pulse">{interimTranscript}</span>
                  )}
                  {isListening && !transcript && !interimTranscript && (
                    <span className="text-gray-400 italic">Start speaking...</span>
                  )}
                </div>
                {(transcript || interimTranscript) && (
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">
                        Words: <span className="font-bold text-purple-600">{(transcript + interimTranscript).trim().split(/\s+/).filter(w => w).length}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {feedback && !feedback.rawFeedback && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">Ready to save or try again?</h3>
                    <p className="text-purple-100 text-sm">
                      {attempts.length > 0 ? `This is attempt #${attempts.length}` : 'This is your first attempt'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetake}
                      className="px-6 py-3 bg-white text-purple-600 rounded-full font-bold hover:bg-purple-50 transition-all shadow-lg hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retake
                    </button>
                    <button
                      onClick={() => savePracticeSession(transcript, feedback, null)}
                      disabled={isSaving}
                      className="px-6 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all shadow-lg hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isSaving ? 'Saving...' : 'Save This Attempt'}
                    </button>
                    {attempts.length > 0 && (
                      <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="px-6 py-3 bg-yellow-500 text-white rounded-full font-bold hover:bg-yellow-600 transition-all shadow-lg hover:scale-105 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {showComparison ? 'Hide' : 'Compare'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showComparison && attempts.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h3 className="text-2xl font-black text-gray-900">Progress Tracking</h3>
                    <span className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold">
                      {attempts.length} Attempt{attempts.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {attempts.map((attempt, index) => (
                      <div key={index} className="bg-white rounded-xl p-5 shadow-lg border-2 border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-500">Attempt #{attempt.attemptNumber}</span>
                          {index === attempts.length - 1 && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">Latest</span>
                          )}
                        </div>
                        <div className={`text-4xl font-black mb-2 ${getScoreColor(attempt.score)}`}>
                          {attempt.score}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Words:</span>
                            <span className="font-bold">{attempt.wordCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fillers:</span>
                            <span className="font-bold text-red-600">{attempt.fillerCount}</span>
                          </div>
                        </div>
                        {index > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className={`text-sm font-bold ${
                              attempt.score > attempts[index - 1].score ? 'text-green-600' :
                              attempt.score < attempts[index - 1].score ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {attempt.score > attempts[index - 1].score && '↗ '}
                              {attempt.score < attempts[index - 1].score && '↘ '}
                              {attempt.score === attempts[index - 1].score && '→ '}
                              {Math.abs(attempt.score - attempts[index - 1].score)} pts vs previous
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {attempts.length > 1 && (
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        Performance Trend
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Best Score</div>
                          <div className="text-2xl font-black text-green-600">
                            {Math.max(...attempts.map(a => a.score))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Average Score</div>
                          <div className="text-2xl font-black text-blue-600">
                            {Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Total Improvement</div>
                          <div className={`text-2xl font-black ${
                            attempts[attempts.length - 1].score > attempts[0].score ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {attempts[attempts.length - 1].score > attempts[0].score ? '+' : ''}
                            {attempts[attempts.length - 1].score - attempts[0].score}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Least Fillers</div>
                          <div className="text-2xl font-black text-purple-600">
                            {Math.min(...attempts.map(a => a.fillerCount))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Overall Performance</h2>
                    <p className="text-gray-600">Based on 5 key speaking metrics</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-6xl font-black ${getScoreColor(feedback.overallScore)}`}>
                      {feedback.overallScore}
                    </div>
                    <div className="text-sm font-bold text-gray-500 uppercase mt-1">
                      {getScoreLabel(feedback.overallScore)}
                    </div>
                  </div>
                </div>
              </div>

              {feedback.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Words</div>
                    <div className="text-3xl font-black text-purple-600">{feedback.stats.wordCount}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Sentences</div>
                    <div className="text-3xl font-black text-purple-600">{feedback.stats.sentenceCount}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Pace (WPM)</div>
                    <div className="text-3xl font-black text-purple-600">{feedback.stats.wordsPerMinute}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Filler Words</div>
                    <div className="text-3xl font-black text-red-600">{feedback.stats.fillerWordCount}</div>
                  </div>
                </div>
              )}

              {feedback.metrics && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Detailed Analysis</h3>
                  <div className="space-y-5">
                    {Object.entries(feedback.metrics).map(([key, data]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreBgColor(data.score)} ${getScoreColor(data.score)}`}>
                              {data.score}
                            </span>
                            <span className="font-bold text-gray-900 capitalize">{key}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreBarColor(data.score)}`}
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 ml-1">{data.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-black text-gray-900">What You Did Well</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-xl font-black text-gray-900">Action Items to Improve</h3>
                  </div>
                  <ul className="space-y-3">
                    {feedback.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-red-600 font-bold mt-0.5 text-lg">•</span>
                        <span className="text-gray-700 font-medium">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {feedback && feedback.rawFeedback && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-black text-gray-900 mb-4">AI Feedback</h3>
              <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm leading-relaxed">
                {feedback.rawFeedback}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5a1 1 0 112 0v3.382a1 1 0 00.553.894l3.382 1.691a1 1 0 010 1.789l-3.382 1.691a1 1 0 00-.553.894V19a1 1 0 11-2 0v-3.382a1 1 0 00-.553-.894l-3.382-1.691a1 1 0 010-1.789l3.382-1.691A1 1 0 0011 8.382V5z" />
                </svg>
                <h3 className="text-2xl font-black text-gray-900">Text to Speech</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Paste any sentence and hear the correct pronunciation instantly.
              </p>
              <textarea
                value={ttsInput}
                onChange={(e) => setTtsInput(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Type the sentence you want to hear..."
              />
              {ttsError && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{ttsError}</p>
              )}
              <button
                onClick={handleSynthesizeSpeech}
                disabled={ttsLoading}
                className="mt-4 px-5 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold shadow hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-60"
              >
                {ttsLoading ? "Generating audio..." : "Play Pronunciation"}
              </button>
              {ttsAudioUrl && (
                <div className="mt-4 space-y-2">
                  <audio controls src={ttsAudioUrl} className="w-full rounded-xl" />
                  <a
                    href={ttsAudioUrl}
                    download="wordup-tts.mp3"
                    className="inline-block text-sm font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Download audio
                  </a>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                </svg>
                <h3 className="text-2xl font-black text-gray-900">Pronunciation Helper</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Check the phonetics and listen to the correct pronunciation of any word.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={pronunciationWord}
                  onChange={(e) => setPronunciationWord(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase tracking-wide"
                  placeholder="Enter a word"
                />
                <button
                  onClick={handlePronunciationLookup}
                  disabled={pronunciationLoading}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-60"
                >
                  {pronunciationLoading ? "Checking..." : "Check"}
                </button>
              </div>
              {pronunciationError && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{pronunciationError}</p>
              )}
              {pronunciationResult && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-blue-700">{pronunciationResult.word}</h4>
                    <span className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold border border-blue-200">
                      {pronunciationResult.phonetic}
                    </span>
                  </div>
                  <audio
                    controls
                    src={pronunciationResult.audioUrl}
                    className="w-full mt-3 rounded-xl"
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    Source: {pronunciationResult.source}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
