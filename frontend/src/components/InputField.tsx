import { InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  type: string;
  placeholder?: string;
  label?: string;
  name: string;
}

const InputField: React.FC<InputFieldProps> = ({
  type, 
  placeholder, 
  label,
  name,
  className = '',
  ...rest
}) => {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-200">
          {label}
        </label>
      )}
      <input 
        className={`w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`} 
        type={type} 
        name={name}
        id={name}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
}

export default InputField