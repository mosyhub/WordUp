import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from '../components/Header';

export default function SpeechImprover() {
  const [title, setTitle] = useState("");
  const [originalDraft, setOriginalDraft] = useState("");
  const [improvedVersion, setImprovedVersion] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedSpeechId, setSavedSpeechId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [analysisType, setAnalysisType] = useState("full");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSpeechId, setEditingSpeechId] = useState(null);
  
  // New states to track changes
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const [lastSavedDraft, setLastSavedDraft] = useState("");
  const [lastSavedImproved, setLastSavedImproved] = useState("");
  const [lastSavedSuggestions, setLastSavedSuggestions] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const analysisOptions = [
    { value: "full", label: "Full Analysis", icon: "📊" },
    { value: "grammar", label: "Grammar Corrections", icon: "✍️" },
    { value: "vocabulary", label: "Vocabulary Enhancement", icon: "📚" },
    { value: "academic", label: "Academic Tone", icon: "🎓" },
    { value: "conversational", label: "Conversational", icon: "💬" },
    { value: "persuasive", label: "Persuasive Style", icon: "🎯" },
    { value: "concise", label: "Make Concise", icon: "✂️" },
    { value: "formal", label: "Formal Business", icon: "💼" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Check if we're in edit mode
    if (location.state?.editSpeech) {
      const speech = location.state.editSpeech;
      setTitle(speech.title);
      setOriginalDraft(speech.originalDraft);
      setImprovedVersion(speech.improvedVersion || "");
      setAiSuggestions(speech.aiSuggestions || "");
      setIsEditMode(true);
      setEditingSpeechId(speech._id);
      setSavedSpeechId(speech._id);
      setIsSaved(true);
      
      // Set last saved values
      setLastSavedTitle(speech.title);
      setLastSavedDraft(speech.originalDraft);
      setLastSavedImproved(speech.improvedVersion || "");
      setLastSavedSuggestions(speech.aiSuggestions || "");
      setHasUnsavedChanges(false);
    }
  }, [location.state]);

  // Check for changes whenever title, draft, or AI results change
  useEffect(() => {
    const titleChanged = title !== lastSavedTitle;
    const draftChanged = originalDraft !== lastSavedDraft;
    const improvedChanged = improvedVersion !== lastSavedImproved;
    const suggestionsChanged = aiSuggestions !== lastSavedSuggestions;
    
    setHasUnsavedChanges(titleChanged || draftChanged || improvedChanged || suggestionsChanged);
  }, [title, originalDraft, improvedVersion, aiSuggestions, lastSavedTitle, lastSavedDraft, lastSavedImproved, lastSavedSuggestions]);

  const getAnalysisPrompt = () => {
    const prompts = {
      full: `You are an expert speech coach. Analyze this speech with a professional, clean format.

IMPORTANT: Write in plain text only. No markdown, no asterisks, no special formatting. Use simple dashes for bullet points.

Provide your analysis in this exact format:

IMPROVED VERSION:
[Write the improved speech here in plain text]

STRENGTHS:
- [First strength]
- [Second strength]  
- [Third strength]

AREAS FOR IMPROVEMENT:
- [First area]
- [Second area]
- [Third area]

SPECIFIC SUGGESTIONS:
- [First tip]
- [Second tip]
- [Third tip]

Original Speech: "${originalDraft}"

Remember: Keep it professional, encouraging, and formatted cleanly with NO markdown symbols.`,

      grammar: `You are a grammar expert. Fix ONLY grammar errors in this speech.

IMPORTANT: Write in plain text only. No markdown, no asterisks, no special formatting.

Provide your analysis in this exact format:

CORRECTED VERSION:
[Write the corrected speech here]

GRAMMAR ISSUES FOUND:
- Issue 1: [Describe the error and why it's wrong]
- Issue 2: [Describe the error and why it's wrong]
- Issue 3: [Describe the error and why it's wrong]

GRAMMAR TIPS:
- Tip 1: [Practical advice]
- Tip 2: [Practical advice]
- Tip 3: [Practical advice]

Original Speech: "${originalDraft}"

Be detailed but keep formatting clean and professional.`,

      vocabulary: `You are a vocabulary enhancement specialist. Improve word choices in this speech.

IMPORTANT: Write in plain text. No markdown or special characters.

Format your response like this:

ENHANCED VERSION:
[Rewrite with better vocabulary]

VOCABULARY UPGRADES:
- Changed [old word] to [new word] because [reason]
- Changed [old word] to [new word] because [reason]
- Changed [old word] to [new word] because [reason]

CONTEXT TIPS:
- [Tip about word choice]
- [Tip about word choice]
- [Tip about word choice]

Original Speech: "${originalDraft}"

Keep tone natural while elevating vocabulary.`,

      academic: `You are an academic writing expert. Transform this into academic tone.

IMPORTANT: Plain text only. No markdown formatting.

Format:

ACADEMIC VERSION:
[Rewritten in formal academic language]

TONE ADJUSTMENTS:
- Changed: [What you changed and why]
- Changed: [What you changed and why]
- Changed: [What you changed and why]

ACADEMIC WRITING TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${originalDraft}"

Use formal language, avoid contractions, add transitional phrases.`,

      conversational: `You are a conversational speech coach. Make this natural and engaging.

IMPORTANT: Plain text format only.

Format:

CONVERSATIONAL VERSION:
[Rewritten in natural, friendly tone]

ENGAGEMENT TECHNIQUES:
- [Technique 1 used]
- [Technique 2 used]
- [Technique 3 used]

DELIVERY TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${originalDraft}"

Use contractions, casual language, rhetorical questions where appropriate.`,

      persuasive: `You are a persuasive communication expert. Make this speech highly persuasive.

IMPORTANT: Clean plain text format.

Format:

PERSUASIVE VERSION:
[Rewritten with persuasive techniques]

PERSUASIVE ELEMENTS ADDED:
- Ethos: [How you established credibility]
- Pathos: [How you appealed to emotion]
- Logos: [How you used logic]

IMPACT TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${originalDraft}"

Add powerful calls to action and emotional appeals.`,

      concise: `You are a conciseness expert. Make this speech shorter and punchier.

IMPORTANT: Plain text only, no formatting symbols.

Format:

CONCISE VERSION:
[Shortened version keeping core message]

WHAT WAS REMOVED:
- [Removed redundancy 1]
- [Removed redundancy 2]
- [Removed redundancy 3]

BREVITY TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${originalDraft}"

Aim to reduce word count by 30-40% while keeping key points.`,

      formal: `You are a business communication expert. Make this professionally formal.

IMPORTANT: Plain text format, professional tone.

Format:

FORMAL VERSION:
[Rewritten in professional business tone]

FORMALITY ADJUSTMENTS:
- Changed: [What was informalized and how]
- Changed: [What was informalized and how]
- Changed: [What was informalized and how]

PROFESSIONAL TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${originalDraft}"

Use professional vocabulary, formal structure, business-appropriate language.`
    };
    return prompts[analysisType] || prompts.full;
  };

  const analyzeSpeech = async () => {
    if (!originalDraft.trim()) {
      setError("Please enter your speech draft first");
      return;
    }

    setLoading(true);
    setError("");
    setAiSuggestions("AI is analyzing your speech...");

    try {
      const COHERE_API_KEY = "vZ6eRMVEtY8tSCzkqepuPoMPznKZlFvHFm4JUsYE";
      
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: getAnalysisPrompt(),
          model: 'command-r7b-12-2024',
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'AI analysis failed');
      }

      setAiSuggestions(data.text);
      setImprovedVersion(data.text);
      
      // Mark as having unsaved changes since AI results changed
      setHasUnsavedChanges(true);

    } catch (err) {
      console.error("AI Analysis error:", err);
      setError("Failed to analyze speech: " + err.message);
      setAiSuggestions("");
    } finally {
      setLoading(false);
    }
  };

  const saveSpeech = async () => {
    if (!title.trim() || !originalDraft.trim()) {
      setError("Title and original draft are required");
      return;
    }

    // Check if there are no changes
    if (!hasUnsavedChanges && isSaved) {
      setError("No changes detected. Please modify your speech before saving again.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Please login first");
        navigate('/login');
        return;
      }

      const url = isEditMode && editingSpeechId 
        ? `http://localhost:5000/speech/${editingSpeechId}`
        : 'http://localhost:5000/speech';
      
      const method = isEditMode && editingSpeechId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          originalDraft,
          improvedVersion,
          aiSuggestions,
          analysis: {
            strengths: [],
            improvements: [],
            grammarIssues: [],
            vocabularyEnhancements: []
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save speech');
      }

      setSuccess(true);
      setSavedSpeechId(data.speech._id);
      setIsSaved(true);
      
      // Update last saved values
      setLastSavedTitle(title);
      setLastSavedDraft(originalDraft);
      setLastSavedImproved(improvedVersion);
      setLastSavedSuggestions(aiSuggestions);
      setHasUnsavedChanges(false);
      
      if (isEditMode) {
        setEditingSpeechId(data.speech._id);
      }
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save speech: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reAnalyze = () => {
    setAiSuggestions("");
    setImprovedVersion("");
    setSuccess(false);
    setError("");
    // Mark as having changes since we cleared the analysis
    setHasUnsavedChanges(true);
  };

  const cancelEdit = () => {
    setTitle("");
    setOriginalDraft("");
    setImprovedVersion("");
    setAiSuggestions("");
    setIsEditMode(false);
    setEditingSpeechId(null);
    setIsSaved(false);
    setSavedSpeechId(null);
    setError("");
    setSuccess(false);
    setLastSavedTitle("");
    setLastSavedDraft("");
    setLastSavedImproved("");
    setLastSavedSuggestions("");
    setHasUnsavedChanges(false);
    navigate('/speeches');
  };

  // Determine if save button should be disabled
  const isSaveDisabled = loading || !title.trim() || !originalDraft.trim() || (!hasUnsavedChanges && isSaved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <Header currentPage="Improve" />

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-10">
          <div className="flex gap-3 mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <Link
              to="/speeches"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition font-semibold shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              Go to Saved Speeches
            </Link>
            {isEditMode && (
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold ml-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="text-center mb-8">
            <h2 className="text-5xl font-black text-gray-900 mb-3">
              <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {isEditMode ? 'Edit Speech' : 'Create Speech'}
              </span>
            </h2>
            <p className="text-gray-600 text-lg">
              {isEditMode 
                ? 'Update your speech draft and re-analyze if needed'
                : 'Write your speech draft and get AI-powered suggestions to improve it'
              }
            </p>
          </div>

          {hasUnsavedChanges && isSaved && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-700 font-semibold">⚠️ You have unsaved changes</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Speech Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Speech About Climate Change"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Analysis Type:
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white font-medium text-gray-700"
            >
              {analysisOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              {analysisType === 'full' && 'Complete analysis with improvements, strengths, suggestions'}
              {analysisType === 'grammar' && 'Focus on fixing grammar errors and punctuation'}
              {analysisType === 'vocabulary' && 'Upgrade vocabulary with sophisticated words'}
              {analysisType === 'academic' && 'Transform into formal academic style'}
              {analysisType === 'conversational' && 'Make natural and engaging'}
              {analysisType === 'persuasive' && 'Add persuasive techniques'}
              {analysisType === 'concise' && 'Remove redundancy, make shorter'}
              {analysisType === 'formal' && 'Professional business style'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Your Draft Speech:
            </label>
            <textarea
              value={originalDraft}
              onChange={(e) => setOriginalDraft(e.target.value)}
              placeholder="Paste or type your speech here..."
              rows="10"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-600 font-medium">
                Word count: <span className="text-purple-600 font-bold">{originalDraft.trim().split(/\s+/).filter(w => w).length}</span>
              </p>
            </div>
          </div>

          {!aiSuggestions && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={saveSpeech}
                disabled={isSaveDisabled}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-xl hover:from-green-600 hover:to-emerald-600 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transform disabled:transform-none flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {isEditMode ? 'Update Speech' : 'Save Speech'}
              </button>

              <button
                onClick={analyzeSpeech}
                disabled={loading || !originalDraft.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl shadow-xl hover:from-purple-700 hover:to-violet-700 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transform disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {analysisOptions.find(o => o.value === analysisType)?.icon} Analyze
                  </>
                )}
              </button>
            </div>
          )}

          {isSaved && !aiSuggestions && !isEditMode && !hasUnsavedChanges && (
            <div className="mb-6 p-5 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center gap-3">
              <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-600 font-bold text-xl">✓ Speech Saved Successfully!</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-600 font-semibold">
                  {isEditMode ? 'Speech updated successfully!' : 'Speech saved successfully!'}
                </p>
              </div>
            </div>
          )}

          {aiSuggestions && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xl font-black text-gray-900">AI Analysis & Suggestions</h3>
                  <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    {analysisOptions.find(o => o.value === analysisType)?.icon}
                  </span>
                </div>
              </div>
              <pre className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl text-gray-700 shadow-inner min-h-[200px] whitespace-pre-wrap font-sans text-sm overflow-auto max-h-[500px] border-2 border-purple-200 leading-relaxed">
                {aiSuggestions}
              </pre>
            </div>
          )}

          {aiSuggestions && !loading && (
            <div className="flex gap-4">
              <button 
                onClick={saveSpeech} 
                disabled={isSaveDisabled}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-xl hover:from-green-600 hover:to-emerald-600 transition-all text-lg font-bold hover:scale-[1.02] transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {loading ? 'Saving...' : isEditMode ? 'Update Speech' : 'Save Speech'}
              </button>
              <button 
                onClick={reAnalyze} 
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-xl hover:from-blue-600 hover:to-cyan-600 transition-all text-lg font-bold hover:scale-[1.02] transform flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-analyze
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}