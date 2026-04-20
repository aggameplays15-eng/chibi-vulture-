"use client";

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Oups !</h2>
              <p className="text-gray-500 text-sm">
                Une erreur inattendue s'est produite. Veuillez réessayer.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-gray-50 rounded-2xl p-4 text-left">
                <p className="text-xs text-gray-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button 
              onClick={this.handleRetry}
              className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black"
            >
              <RefreshCw size={18} className="mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
