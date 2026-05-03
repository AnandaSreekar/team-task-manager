import React from 'react';

class ErrorBoundary extends React.Component {
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

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 max-w-lg w-full p-8 text-center">
            <div className="text-5xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-4 text-sm">
              An unexpected error occurred. The details are shown below.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6 overflow-auto max-h-40">
              <code className="text-red-700 text-xs break-all whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <button
              onClick={this.handleReload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors duration-200"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
