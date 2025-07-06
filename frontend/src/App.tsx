import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Userprofile from './pages/Userprofile';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Navbar/>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute>
                  <Transactions/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-transaction" 
              element={
                <ProtectedRoute>
                  <AddTransaction/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/insights" 
              element={
                <ProtectedRoute>
                  <Insights/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Userprofile/>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
