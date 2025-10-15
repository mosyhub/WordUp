import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Practice from "./pages/practice";
import Login from "./pages/login";
import Register from "./pages/register";
import SpeechImprover from './speechImprover';
import UserDashboard from './userDashboard';
import AdminDashboard from "./adminDashboard";
import SpeechDetail from './speechDetail';
import SavedSpeeches from './savedSpeeches';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/improve" element={<SpeechImprover />} />
      <Route path="/dashboard" element={<UserDashboard />} />
       <Route path="/admin" element={<AdminDashboard />} /> 
       <Route path="/speeches/:id" element={<SpeechDetail />} />
        <Route path="/speeches" element={<SavedSpeeches />} />
    </Routes>
  );
}