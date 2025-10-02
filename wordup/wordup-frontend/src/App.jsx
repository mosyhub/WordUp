import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Practice from "./pages/practice";
import Login from "./pages/login";
import Register from "./pages/register";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}