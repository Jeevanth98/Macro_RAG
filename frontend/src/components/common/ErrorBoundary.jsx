import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '2rem',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #EF4444',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#EF4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Application Error
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              An unexpected error occurred in the user interface. Please try reloading the page.
            </p>
            
            <div style={{
              marginTop: '1.5rem',
              backgroundColor: '#020617',
              padding: '1rem',
              borderRadius: '6px',
              overflowX: 'auto',
              border: '1px solid #334155'
            }}>
              <p style={{ color: '#F1F5F9', fontWeight: 'bold', margin: '0 0 0.5rem 0', fontFamily: 'monospace' }}>
                {this.state.error && this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <pre style={{
                  color: '#94A3B8',
                  fontSize: '0.8rem',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
