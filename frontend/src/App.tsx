import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Transactions from './pages/Transactions';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar/>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/transactions" element={<Transactions/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
