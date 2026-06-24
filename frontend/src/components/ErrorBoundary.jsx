import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught runtime exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card glow-red" style={{ 
          padding: '40px 30px', 
          textAlign: 'center', 
          maxWidth: '500px', 
          margin: '40px auto', 
          borderRadius: '16px' 
        }}>
          <ShieldAlert size={48} style={{ color: 'var(--error)', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Something went wrong</h3>
          <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
            A rendering exception or connection timeout occurred while loading this interface section.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Reload Platform
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
