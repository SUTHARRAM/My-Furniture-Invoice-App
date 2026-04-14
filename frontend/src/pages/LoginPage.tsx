import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registered, setRegistered] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-peach-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-md p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🪑</div>
          <h1 className="text-xl font-bold text-gray-800">Invoice Manager</h1>
          <p className="text-sm text-gray-500">Carpentry & Furniture Billing</p>
        </div>

        {registered && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4">
            Account created! Please sign in.
          </div>
        )}

        {mode === 'login' ? (
          <>
            <LoginForm />
            <p className="text-center text-sm text-gray-500 mt-4">
              No account?{' '}
              <button onClick={() => setMode('register')} className="text-peach-500 hover:underline font-medium">Register</button>
            </p>
          </>
        ) : (
          <>
            <RegisterForm onSuccess={() => { setMode('login'); setRegistered(true); }} />
            <p className="text-center text-sm text-gray-500 mt-4">
              Have an account?{' '}
              <button onClick={() => setMode('login')} className="text-peach-500 hover:underline font-medium">Sign in</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
