import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch, useAdminAuth } from "@/lib/admin-auth";
import { Upload, RefreshCw, GitBranch, Globe, FileText } from "lucide-react";

export default function DeployPage() {
  const { token } = useAdminAuth();
  const [status, setStatus] = useState<{ status: string; branch: string; remote: string } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [message, setMessage] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const r = await adminFetch("/api/admin/git-status", token);
      if (!r.ok) throw new Error("Errore nel recupero dello stato");
      setStatus(await r.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleDeploy = async () => {
    setError(null);
    setOutput(null);
    if (!message.trim()) {
      setError("Inserisci un messaggio che descriva le modifiche.");
      return;
    }
    setDeploying(true);
    try {
      const r = await adminFetch("/api/admin/deploy", token, {
        method: "POST",
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Errore sconosciuto");
      setOutput(data.output || "Pubblicato con successo.");
      setMessage("");
      fetchStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeploying(false);
    }
  };

  const hasChanges = status && status.status.length > 0;

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Upload size={20} className="text-[#2C2826]" />
          <h1 className="font-serif text-2xl text-[#2C2826]">Pubblica su GitHub</h1>
        </div>

        {/* Git info */}
        <div className="bg-white border border-[#E8E3DC] p-5 rounded mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Stato repository</p>
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="text-xs text-[#8B8680] hover:text-[#2C2826] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className={loadingStatus ? "animate-spin" : ""} />
              Aggiorna
            </button>
          </div>

          {loadingStatus ? (
            <div className="h-8 flex items-center">
              <div className="w-4 h-4 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : status ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch size={14} className="text-[#8B8680]" />
                <span className="text-[#8B8680]">Branch:</span>
                <span className="font-medium text-[#2C2826]">{status.branch || "—"}</span>
              </div>
              {status.remote && (
                <div className="flex items-start gap-2 text-sm">
                  <Globe size={14} className="text-[#8B8680] mt-0.5 shrink-0" />
                  <span className="text-[#8B8680] shrink-0">Remote:</span>
                  <span className="font-medium text-[#2C2826] break-all text-xs">{status.remote.split("\n")[0]}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <FileText size={14} className="text-[#8B8680] mt-0.5 shrink-0" />
                <span className="text-[#8B8680] shrink-0">Modifiche:</span>
                {hasChanges ? (
                  <pre className="font-mono text-xs text-[#2C2826] whitespace-pre-wrap">{status.status}</pre>
                ) : (
                  <span className="text-[#8B8680] italic">Nessuna modifica in sospeso</span>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Commit & push */}
        <div className="bg-white border border-[#E8E3DC] p-5 rounded mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-4">Pubblica modifiche</p>
          <p className="text-sm text-[#6B6560] mb-4 leading-relaxed">
            Descrivi brevemente le modifiche fatte (es. "Aggiunto nuovo prodotto", "Aggiornate le foto").
            Poi clicca <strong>Pubblica</strong> per salvare e inviare tutto su GitHub.
          </p>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !deploying && handleDeploy()}
            placeholder="Descrizione delle modifiche…"
            className="w-full border border-[#E8E3DC] px-4 py-3 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#2C2826] mb-4"
          />
          <button
            onClick={handleDeploy}
            disabled={deploying || !message.trim()}
            className="w-full bg-[#2C2826] text-white py-3 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#3C3835] transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {deploying ? "Pubblicazione in corso…" : "Pubblica su GitHub"}
          </button>
        </div>

        {/* Output */}
        {output && (
          <div className="bg-[#F0EBE3] border border-[#E8E3DC] p-4 rounded">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-2">Risultato</p>
            <pre className="text-xs text-[#2C2826] whitespace-pre-wrap font-mono">{output}</pre>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-xs uppercase tracking-[0.2em] text-red-500 mb-1">Errore</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
