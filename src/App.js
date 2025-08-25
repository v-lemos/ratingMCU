import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ThemeProvider } from './ThemeContext';
import './App.css';
import MCURankings from './MCURankings';
import AuthModal from './AuthModal';
import Header from './Header';
import Footer from './Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TitlePage from './TitlePage';

function App() {
  const [user, setUser] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setIsReadOnly(false);
        setShowAuthModal(false);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsReadOnly(false);
          setShowAuthModal(false);
        } else {
          setUser(null);
          setShowAuthModal(true);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsReadOnly(false);
    setShowAuthModal(false);
  };

  const handleGuestMode = () => {
    setUser(null);
    setIsReadOnly(true);
    setShowAuthModal(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsReadOnly(false);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading MCU Rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className={`App ${isReadOnly ? 'guest-mode' : ''}`}>
          <div className={`main-content ${showAuthModal ? 'blurred' : ''}`}>
            <Header user={user} onSignOut={handleSignOut} />
            <Routes>
              <Route path="/" element={<MCURankings isReadOnly={isReadOnly} />} />
              <Route path="/title/:id" element={<TitlePage />} />
            </Routes>
            <Footer />
          </div>
          {showAuthModal && (
            <AuthModal 
              onLogin={handleLogin}
              onGuestMode={handleGuestMode}
            />
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
