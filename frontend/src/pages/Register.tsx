import { useState } from "react";
import InputField from "../components/InputField";
import { Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registration data:", formData);
    // Add your registration logic here
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2">Create an account</h2>
          <p className="text-sm text-gray-400">Start your financial journey with FinLogix</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md flex flex-col gap-2">
            <InputField 
              name="fullName"
              type="text" 
              placeholder="Full Name" 
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <InputField 
              name="email"
              type="email" 
              placeholder="Email address" 
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <InputField 
              name="password"
              type="password" 
              placeholder="Password" 
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <InputField 
              name="confirmPassword"
              type="password" 
              placeholder="Confirm Password" 
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              required
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-300">
              I agree to the <a href="#" className="text-blue-500 hover:text-blue-400">Terms of Service</a> and <a href="#" className="text-blue-500 hover:text-blue-400">Privacy Policy</a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
            >
              Sign up
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
