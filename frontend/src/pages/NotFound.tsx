import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-reading mx-auto py-24 text-center space-y-5">
      <div className="inline-block px-3 py-1 rounded-pill bg-orange-500/10 text-orange-text text-xs font-bold font-mono">
        404 · PAGE NOT FOUND
      </div>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">Page not found</h1>
        <p className="text-xs text-text-muted mt-2 max-w-sm mx-auto leading-relaxed">
          The requested page could not be located in Pramaan. Check the URL or return to the workspace.
        </p>
      </div>

      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-pill bg-surface-dark text-white dark:bg-orange-500 dark:text-on-orange text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};
