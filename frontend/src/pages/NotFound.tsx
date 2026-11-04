import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-reading mx-auto py-16 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto">
        <FileQuestion className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-text">Page Not Found (404)</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          The requested page or resource could not be found. Please check the URL or return to the main workspace.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center space-x-3">
        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-btn bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors inline-flex items-center space-x-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/app/new"
          className="px-3.5 py-1.5 rounded-btn border border-border bg-surface text-text text-xs font-medium hover:bg-surface-2 transition-colors inline-flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Start New Review</span>
        </Link>
      </div>
    </div>
  );
};

