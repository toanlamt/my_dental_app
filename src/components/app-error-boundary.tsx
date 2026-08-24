import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AppErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  description: string;
  reloadLabel: string;
  homeLabel: string;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error boundary caught an error', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-16 text-center lg:px-8">
        <h1 className="public-heading mx-auto">{this.props.title}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#52716e]">{this.props.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="public-button bg-[#12343b] text-white"
            onClick={() => window.location.reload()}
          >
            {this.props.reloadLabel}
          </button>
          <Link to="/" className="public-button border border-[#9ab8b0] text-[#12343b]">
            {this.props.homeLabel}
          </Link>
        </div>
      </main>
    );
  }
}
