import { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * Global Error Boundary to catch React rendering errors
 * Ensures the app doesn't crash to a blank screen on unexpected exceptions.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="bg-white p-10 brutal-border shadow-brutal max-w-xl text-center rotate-1">
            <div className="bg-primary p-4 inline-block brutal-border mb-6">
              <AlertTriangle className="w-16 h-16 text-brutalBlack stroke-[3]" />
            </div>
            <h1 className="text-4xl font-black uppercase mb-4 text-brutalBlack">System Error</h1>
            <p className="text-xl font-bold mb-8 bg-gray-100 p-4 brutal-border">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-secondary text-white px-8 py-4 brutal-border font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-brutal transition-all flex items-center justify-center w-full"
            >
              <RefreshCcw className="w-6 h-6 mr-3 stroke-[3]" />
              Restart Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
