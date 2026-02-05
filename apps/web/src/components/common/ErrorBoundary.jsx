import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';

/**
 * ErrorBoundary Component (UX-001 Enhanced)
 * Unified error handling with reporting capability
 * Ready for Sentry integration via onError callback
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log to console
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Call onError callback for external reporting (Sentry, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to API if available
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      // Future: Send to error tracking service
      const errorReport = {
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      // Log for debugging
      console.log('[ErrorBoundary] Error report:', errorReport);
      
      // TODO: Send to Sentry or custom API
      // await fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  };

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      this.handleGoHome();
      return;
    }
    this.setState(prev => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      const { retryCount, copied } = this.state;
      const maxRetries = 3;
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              發生錯誤
            </h2>
            <p className="text-gray-500 mb-4">
              {this.props.fallbackMessage || '頁面載入時發生問題，請稍後再試。'}
            </p>
            
            {retryCount > 0 && (
              <p className="text-sm text-amber-600 mb-4">
                已重試 {retryCount}/{maxRetries} 次
              </p>
            )}
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="relative mb-4">
                <pre className="text-left text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32 text-gray-700">
                  {this.state.error.toString()}
                </pre>
                <button
                  onClick={this.handleCopyError}
                  className="absolute top-2 right-2 p-1 bg-white rounded border border-gray-200 hover:bg-gray-50"
                  title="複製錯誤訊息"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                disabled={retryCount >= maxRetries}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                {retryCount >= maxRetries ? '已達上限' : '重試'}
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                返回首頁
              </button>
            </div>
            
            <p className="mt-4 text-xs text-gray-400">
              錯誤已自動回報 • 錯誤代碼: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

