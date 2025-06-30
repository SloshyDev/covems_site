'use client';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });
    if (res.error) {
      setError('Usuario o contraseña incorrectos');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="mx-auto flex w-1/2 items-center justify-center bg-gradient-to-br">
      <div className="w-full max-w-sm rounded-xl bg-gray-600/45 p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <UserCircleIcon className="h-16 w-16 text-white" />
          <h2 className="mt-3 text-2xl font-bold text-blue-300">COVEMS</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-indigo-500 py-2 font-semibold text-white transition-colors hover:bg-indigo-600"
          >
            Entrar
          </button>
          {error && (
            <p className="mt-2 text-center text-sm text-red-500">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
