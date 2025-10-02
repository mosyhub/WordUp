import { useState, useRef } from "react";
import { Link } from "react-router-dom";

export default function Practice() {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        handleAudioUpload(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setFeedback("❌ Error accessing microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.wav");

      const response = await fetch("http://localhost:5000/speech/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.transcript);
      setFeedback(data.feedback);
    } catch (err) {
      console.error(err);
      setFeedback("❌ Error analyzing speech. Make sure your backend is running on localhost:5000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700 flex items-center gap-2">
          🎤 SpeakUp
        </h1>
        <nav className="space-x-6">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 transition">Home</Link>
          <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition">Login</Link>
          <Link to="/register" className="text-gray-600 hover:text-indigo-600 transition">Register</Link>
          <Link to="/practice" className="text-gray-600 hover:text-indigo-600 transition">Practice</Link>
        </nav>
      </header>

      {/* Practice Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
          {/* Header */}
          <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-2">
            🎤 SpeakUp Coach
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Practice your speech and get instant AI-powered feedback.
          </p>

          {/* Recorder */}
          <div className="flex flex-col items-center gap-6">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isRecording
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🎙 Status: {isRecording ? "recording" : "idle"}
            </span>

            <div className="flex gap-6">
              <button
                onClick={startRecording}
                disabled={isRecording}
                className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶ Start Recording
              </button>

              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="px-6 py-3 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏹ Stop & Analyze
              </button>
            </div>

            {audioUrl && (
              <audio
                src={audioUrl}
                controls
                className="mt-4 w-full border border-gray-300 rounded-lg shadow-inner"
              />
            )}
          </div>

          {/* Loading */}
          {loading && (
            <p className="text-center text-indigo-600 font-medium mt-6 animate-pulse">
              ⏳ Analyzing your speech...
            </p>
          )}

          <hr className="my-8 border-gray-200" />

          {/* Results */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-700">📝 Transcript</h3>
              <p className="p-4 bg-gray-50 rounded-lg text-gray-500 shadow-inner min-h-[80px]">
                {transcript || "Waiting for your speech..."}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-700">💡 Feedback</h3>
              <p className="p-4 bg-gray-50 rounded-lg text-gray-500 shadow-inner min-h-[80px]">
                {feedback || "Feedback will appear here after analysis."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}