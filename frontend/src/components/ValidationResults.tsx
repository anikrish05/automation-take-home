
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Check, X, ArrowLeft, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ValidationResultsProps {
  url: string;
}

interface TestResult {
  name: string;
  status: 'success' | 'fail' | 'pending';
  message: string;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ url }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Page Accessibility', status: 'pending', message: 'Checking if the landing page is accessible...' },
    { name: 'Demo Button Detection', status: 'pending', message: 'Looking for "Book a Demo" buttons or links...' },
    { name: 'Form Validation', status: 'pending', message: 'Validating form fields and submission...' },
    { name: 'Booking Process', status: 'pending', message: 'Testing the complete booking flow...' },
    { name: 'Confirmation Page', status: 'pending', message: 'Verifying successful completion...' },
  ]);

  useEffect(() => {
    const eventSource = new EventSource(`http://localhost:5001/stream-validate?url=${encodeURIComponent(url)}`);
  
    eventSource.onmessage = (event) => {
      const newResult = JSON.parse(event.data);
      setTestResults(prev => {
        const updated = [...prev];
        const index = updated.findIndex(t => t.name === newResult.name);
        if (index !== -1) updated[index] = newResult;
        return updated;
      });
  
      setProgress(prev => Math.min(prev + 20, 100)); // adjust if more steps
    };
  
    eventSource.addEventListener('done', () => {
      setIsComplete(true);
      eventSource.close();
    });
  
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
      setIsComplete(true);
    };
  
    return () => {
      eventSource.close();
    };
  }, [url]);
  
  

  const getSuccessMessage = (index: number): string => {
    const messages = [
      'Page is accessible and loads properly.',
      'Found "Book a Demo" button on the page.',
      'Form validation is working correctly.',
      'Booking process flow is functional.',
      'Confirmation page displayed successfully.',
    ];
    return messages[index];
  };

  const getFailMessage = (index: number): string => {
    const messages = [
      'Page has accessibility issues or slow loading time.',
      'No "Book a Demo" button or link found on the page.',
      'Form has validation issues or missing required fields.',
      'Booking process flow has interruptions or errors.',
      'No confirmation page or unclear success indication.',
    ];
    return messages[index];
  };

  const getTotalScore = (): number => {
    const successCount = testResults.filter(test => test.status === 'success').length;
    return Math.round((successCount / testResults.length) * 100);
  };

  return (
    <div className="w-full space-y-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-smooth space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Validation Results</h2>
            {isComplete && (
              <div className="text-sm font-medium">
                Score: <span className={`${getTotalScore() >= 60 ? 'text-green-500' : 'text-red-500'}`}>{getTotalScore()}%</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>Testing:</span> 
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 truncate max-w-[250px] sm:max-w-[400px]"
            >
              {url} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          {!isComplete && (
            <div className="space-y-1 mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {testResults.map((test, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                test.status === 'success' ? 'bg-green-50 border-green-200' :
                test.status === 'fail' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              } transition-all duration-300 animate-fade-up`}
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-1 ${
                  test.status === 'success' ? 'bg-green-100 text-green-600' :
                  test.status === 'fail' ? 'bg-red-100 text-red-600' :
                  'bg-gray-200 text-gray-500 animate-pulse'
                }`}>
                  {test.status === 'success' ? <Check className="w-4 h-4" /> : 
                   test.status === 'fail' ? <X className="w-4 h-4" /> :
                   <div className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-sm">{test.name}</div>
                  <div className="text-xs text-muted-foreground">{test.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between pt-4">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          
          {isComplete && (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground smooth-transition"
              onClick={() => window.location.reload()}
            >
              Test Again
            </Button>
          )}
        </div>
      </div>
      
      {isComplete && (
        <div className="glass-card p-6 rounded-2xl shadow-smooth space-y-4 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-md font-medium">Recommendations</h3>
          <ul className="space-y-2 text-sm">
            {testResults.some(test => test.status === 'fail') ? (
              testResults
                .filter(test => test.status === 'fail')
                .map((test, i) => (
                  <li key={i} className="text-muted-foreground flex gap-2">
                    <span>•</span>
                    <span>Improve {test.name.toLowerCase()} by addressing the issues found.</span>
                  </li>
                ))
            ) : (
              <li className="text-muted-foreground flex gap-2">
                <span>•</span>
                <span>Excellent! Your landing page conversion flow is performing well.</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;
