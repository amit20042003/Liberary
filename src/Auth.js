import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { BookOpen, Mail, Lock } from 'lucide-react';

// Yahan 'export default' kiya gaya hai, yeh sahi hai.
export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });
    
    try {
      let error;
      if (isLoginView) {
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
        if (!error) {
            setMessage({ type: 'success', content: 'Sign up successful! Please check your email to verify your account.' });
        }
      }
      if (error) throw error;
    } catch (error) {
      setMessage({ type: 'error', content: `Error: ${error.error_description || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-indigo-100 rounded-full">
            <BookOpen className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Library Manager</h1>
          <p className="text-gray-600">{isLoginView ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleAuth}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="email"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="password"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              type="password"
              placeholder="Your password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-transform transform hover:scale-105"
          >
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {message.content && (
            <p className={`text-center text-sm p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.content}
            </p>
        )}
        
        <div className="text-center">
          <button
            onClick={() => { setIsLoginView(!isLoginView); setMessage({ type: '', content: '' }); }}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            {isLoginView ? "Don't have an account? Sign Up" : 'Already have an an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
