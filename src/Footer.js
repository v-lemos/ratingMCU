import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Rating the MCU by VL. I guess all rights reserved, I don't really care.</p>
      </div>
    </footer>
  );
};

export default Footer;