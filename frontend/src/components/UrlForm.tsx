
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight } from "lucide-react";

const UrlForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "URL is required",
        description: "Please enter a landing page URL to validate",
        variant: "destructive",
      });
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate processing
    setTimeout(() => {
      // Navigate to results page with the URL as state
      navigate('/results', { state: { url } });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-smooth">
        <div className="space-y-3">
          <label htmlFor="url" className="block text-sm font-medium text-foreground">
            Landing Page URL
          </label>
          <div className="relative">
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
              className="w-full rounded-lg bg-white/50 dark:bg-black/10 border border-input py-3 pl-4 pr-12 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary input-focus-ring smooth-transition"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the URL of the landing page you want to validate
          </p>
        </div>
        
        <div className="mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-3 smooth-transition flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <>Processing</>
            ) : (
              <>
                Start Validation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 smooth-transition" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-center text-muted-foreground animate-fade-up" style={{ animationDelay: '0.3s' }}>
        We'll analyze your landing page for demo booking functionality and conversion flow
      </div>
    </form>
  );
};

export default UrlForm;
