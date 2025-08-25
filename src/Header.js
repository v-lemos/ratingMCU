import React from 'react';
import ThemeToggle from './ThemeToggle';
import './Header.css';
import { Link } from 'react-router-dom';

const Header = ({ user, onSignOut }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <Link to="/" className="header-title-link">
            <span className="title-rating-the">RATING THE</span> <span className="title-mcu">MCU</span>
          </Link>
        </h1>
        <div className="header-actions">
          <ThemeToggle />
          {user && (
            <button onClick={onSignOut} className="sign-out-btn">Sign Out</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;