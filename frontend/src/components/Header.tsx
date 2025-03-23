
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="w-full mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="inline-block mb-1">
          <Link 
            to="/"
            className="text-sm font-medium tracking-wider text-primary/80 uppercase smooth-transition hover:text-primary"
          >
            Landing Page Validator
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Lead Funnel Validation Tool
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg">
          Verify your landing page conversion flow and ensure your "Book a Demo" process works flawlessly.
        </p>
      </div>
    </header>
  );
};

export default Header;
