import React from 'react';
import ThemeToggle from './ThemeToggle';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">Rating the MCU</h1>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;