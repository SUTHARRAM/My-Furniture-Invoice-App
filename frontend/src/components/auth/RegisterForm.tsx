import React, { useState } from 'react';
import { authApi } from '../../api/authApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Props { onSuccess: () => void; }

export function RegisterForm({ onSuccess }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({ name, email, password });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" loading={loading} className="w-full justify-center">Create Account</Button>
    </form>
  );
}
