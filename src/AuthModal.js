import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './AuthModal.css';

const AuthModal = ({ onLogin, onGuestMode }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Predefined admin credentials
  const ADMIN_EMAIL = 'admin@mcurankings.local';
  const ADMIN_PASSWORD = '';

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try to sign in with the admin account
      const result = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: password,
      });

      if (result.error) {
        // If admin account doesn't exist, create it
        if (result.error.message.includes('Invalid login credentials')) {
          const signUpResult = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          });

          if (signUpResult.error) throw signUpResult.error;

          // Now try to sign in with the correct password
          if (password === ADMIN_PASSWORD) {
            const loginResult = await supabase.auth.signInWithPassword({
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
            });

            if (loginResult.error) throw loginResult.error;

            if (loginResult.data.user) {
              onLogin(loginResult.data.user);
            }
          } else {
            setError('Incorrect admin password');
          }
        } else {
          throw result.error;
        }
      } else if (result.data.user) {
        onLogin(result.data.user);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Incorrect admin password');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    onGuestMode();
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h2>MCU Rankings Access</h2>
        <p>Enter admin password to edit rankings or continue as guest to view only:</p>

        <form onSubmit={handleAuth} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Admin Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="password-input"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Please wait...' : 'Login as Admin'}
            </button>
            <button type="button" onClick={handleGuestMode} className="guest-btn" disabled={loading}>
              Continue as Guest
            </button>
          </div>
        </form>


      </div>
    </div>
  );
};

export default AuthModal;