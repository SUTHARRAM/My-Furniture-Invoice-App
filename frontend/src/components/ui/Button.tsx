import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'bg-peach-200 hover:bg-peach-300 text-gray-800 font-semibold border border-peach-300',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white font-semibold',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
};
const sizes = { sm: 'px-3 py-1 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' };

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
}
