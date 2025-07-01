import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);
  const login = false;

  return (
    <div className="flex w-full py-3 px-7 sm:py-5 sm:px-10 bg-gray-800 text-white items-center justify-between">
      <h3 className="text-2xl font-extrabold">FinLogix</h3>
      {/* when login true, show this */}
      <div>
        {login ? (
          <ul className="sm:flex gap-5 hidden">
            <li className="cursor-pointer hover:text-gray-400">Home</li>
            <li className="cursor-pointer hover:text-gray-400">About</li>
            <li className="cursor-pointer hover:text-gray-400">Contact</li>
          </ul>
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
        {login && (
          <div
            onClick={() => setIsClicked(!isClicked)}
            className="cursor-pointer hover:text-gray-400 sm:hidden"
          >
            Menu
          </div>
        )}
        {isClicked && (
          <ul className="absolute right-10 top-16 p-5 text-black bg-white rounded border shadow-xl flex flex-col gap-3">
            <li className="cursor-pointer hover:text-gray-400">Home</li>
            <li className="cursor-pointer hover:text-gray-400">About</li>
            <li className="cursor-pointer hover:text-gray-400">Contact</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar;
