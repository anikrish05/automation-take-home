
import React from 'react';
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="main-layout">
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className={cn("w-full max-w-2xl mx-auto animate-fade-in", className)}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
