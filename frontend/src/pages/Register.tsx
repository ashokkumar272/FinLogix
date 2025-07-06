import { useState } from "react";
import InputField from "../components/InputField";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter");
      setIsLoading(false);
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter");
      setIsLoading(false);
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError("Password must contain at least one number");
      setIsLoading(false);
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
      navigate("/transactions");
    } catch (err: any) {
      console.error("Registration error:", err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2">Create an account</h2>
          <p className="text-sm text-gray-400">Start your financial journey with FinLogix</p>
        </div>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md flex flex-col gap-2">
            <InputField 
              name="name"
              type="text" 
              placeholder="Full Name" 
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <InputField 
              name="email"
              type="email" 
              placeholder="Email address" 
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <InputField 
              name="password"
              type="password" 
              placeholder="Password" 
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Password must be at least 8 characters with uppercase, lowercase, and number
            </p>
            <InputField 
              name="confirmPassword"
              type="password" 
              placeholder="Confirm Password" 
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              required
              disabled={isLoading}
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-300">
              I agree to the <a href="#" className="text-blue-500 hover:text-blue-400">Terms of Service</a> and <a href="#" className="text-blue-500 hover:text-blue-400">Privacy Policy</a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                "Sign up"
              )}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
