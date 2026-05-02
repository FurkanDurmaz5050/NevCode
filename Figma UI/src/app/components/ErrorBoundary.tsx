// Basic ErrorBoundary — panel sayfaları render hatasında crash etmesin.
import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.label, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900">
          <div className="text-sm font-semibold mb-1">Bir şeyler ters gitti.</div>
          <div className="text-xs text-rose-700 mb-3">{this.state.error.message}</div>
          <button
            onClick={this.reset}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-900 text-white hover:bg-rose-800"
          >
            Tekrar dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
