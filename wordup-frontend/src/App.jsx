import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Practice from "./pages/practice";
import Login from "./pages/login";
import Register from "./pages/register";
import SpeechImprover from './pages/speechImprover';
import UserDashboard from './pages/userDashboard';
import AdminDashboard from "./pages/adminDashboard";
import SpeechDetail from './pages/speechDetail';
import SavedSpeeches from './pages/savedSpeeches';
import PracticeHistory from "./pages/practiceHistory";
import ProgressPage from './pages/progressPage';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/history" element={<PracticeHistory />} />
      <Route path="/improve" element={<SpeechImprover />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} /> 
      <Route path="/speeches/:id" element={<SpeechDetail />} />
      <Route path="/speeches" element={<SavedSpeeches />} />
      <Route path="/progress" element={<ProgressPage />} />
    </Routes>
  );
}