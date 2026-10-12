import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

// Catches render errors so a single broken page shows a message instead of a blank screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Render error:", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 pt-24 text-center">
        <h1 className="font-serif text-3xl text-[#2C2826] mb-3">Qualcosa è andato storto</h1>
        <p className="text-[#8B8680] font-light mb-8 max-w-md">
          Non siamo riusciti a caricare questa pagina. Riprova tra qualche istante.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#2C2826] text-white px-8 py-3 rounded-full text-sm uppercase tracking-[0.15em] hover:bg-[#3C3835] transition-colors"
        >
          Ricarica
        </button>
      </div>
    );
  }
}
