import React from 'react';
import ThemeToggle from './ThemeToggle';
import './Header.css';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

const Header = ({ user, onSignOut }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <Link to="/" className="header-title-link">
            <span className="title-rating-the">RATING THE</span> <span className="title-mcu">MCU</span>
          </Link>
        </h1>
        <SearchBar />
        <div className="header-actions">
          <ThemeToggle />
          {user && (
            <button onClick={onSignOut} className="sign-out-btn" aria-label="Sign Out">
              <span className="signout-icon" aria-hidden="true">🚪</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;