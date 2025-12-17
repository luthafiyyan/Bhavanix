import React from 'react';

export const Button = ({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 disabled:opacity-50",
    secondary: "bg-white/50 hover:bg-white/80 text-gray-800 border border-white/20 disabled:opacity-50",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 disabled:opacity-50",
    ghost: "bg-transparent hover:bg-white/20 text-gray-700 disabled:opacity-50",
    google: "bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-md disabled:opacity-50"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
