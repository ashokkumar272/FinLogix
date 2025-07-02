import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isClicked, setIsClicked] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Don't show navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <div className="flex w-full py-3 px-7 sm:py-5 sm:px-10 bg-gray-800 text-white items-center justify-between">
      <Link to="/" className="text-2xl font-extrabold hover:text-blue-400 transition-colors">
        FinLogix
      </Link>
      
      <div>
        {isAuthenticated ? (
          <>
            <ul className="sm:flex gap-5 hidden items-center">
              <Link to="/transactions" className="cursor-pointer hover:text-gray-400 px-3 py-1">
                Transactions
              </Link>
              <li className="cursor-pointer hover:text-gray-400 px-3 py-1">
                Dashboard
              </li>
              <li className="text-gray-300">
                Welcome, {user?.name || 'User'}
              </li>
              <button
                onClick={handleLogout}
                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </ul>
            
            <div
              onClick={() => setIsClicked(!isClicked)}
              className="cursor-pointer hover:text-gray-400 sm:hidden"
            >
              Menu
            </div>
            
            {isClicked && (
              <ul className="absolute right-10 top-16 p-5 text-black bg-white rounded border shadow-xl flex flex-col gap-3 z-50">
                <Link to="/transactions" className="cursor-pointer hover:text-gray-600">
                  Transactions
                </Link>
                <li className="cursor-pointer hover:text-gray-600">Dashboard</li>
                <li className="text-gray-600 border-t pt-2">
                  {user?.name || 'User'}
                </li>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </ul>
            )}
          </>
        ) : (
          <ul className="flex gap-5">
            <Link to="/login" className="cursor-pointer hover:text-gray-400 px-4 py-1">
              Login
            </Link>
            <Link to="/register" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg transition-colors duration-200">
              Sign Up
            </Link>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar;
