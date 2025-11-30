import React, { useState } from 'react';
import { Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';

const NavBar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // fixed container so nav does not scroll with the page
    <div className="fixed inset-x-0 top-4 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
  <div className="bg-white/30 backdrop-blur-sm border border-white/20 px-3 sm:px-4 py-3 flex justify-between items-center rounded-md shadow-sm">
          <div className="flex items-center space-x-3">
            <img src="src/assets/BrainArtz-black.png" alt="BrainArtz Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-gray-900">BrainArtz</h1>
          </div>

          <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Main navigation">
            <a href="#services" className="text-gray-900 hover:text-blue-600 transition">Services</a>
            <a href="#about" className="text-gray-900 hover:text-blue-600 transition">About</a>
            <a href="#works" className="text-gray-900 hover:text-blue-600 transition">Our Work</a>
            <a href="#contact" className="text-gray-900 hover:text-blue-600 transition">Contact</a>
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md text-gray-900 hover:bg-white/10"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((s) => !s)}
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown - appears under the nav bar when open */}
        {mobileOpen && (
          <div className="bg-white/20 backdrop-blur-sm rounded-b-md mt-1 p-4 md:hidden border border-white/10">
            <div className="flex flex-col space-y-3">
              <a href="#services" className="text-gray-900 hover:text-blue-600">Services</a>
              <a href="#about" className="text-gray-900 hover:text-blue-600">About</a>
              <a href="#works" className="text-gray-900 hover:text-blue-600">Our Work</a>
              <a href="#contact" className="text-gray-900 hover:text-blue-600">Contact</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavBar;
