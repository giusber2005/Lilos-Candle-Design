import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { Send, Trash2, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Subscriber {
  id: number;
  email: string;
  firstName: string | null;
  createdAt: string;
}

export default function NewsletterPage() {
  const { token } = useAdminAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadSubscribers = () => {
    setLoading(true);
    adminFetch("/api/admin/newsletter/subscribers", token)
      .then((r) => r.json())
      .then((data) => { setSubscribers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(loadSubscribers, [token]);

  // Load default templates from email settings
  useEffect(() => {
    adminFetch("/api/admin/email-settings", token)
      .then((r) => r.json())
      .then((data) => {
        if (data.email_newsletter_default_subject) setSubject(data.email_newsletter_default_subject);
        if (data.email_newsletter_default_body) setBody(data.email_newsletter_default_body);
      })
      .catch(() => {});
  }, [token]);

  const toggleAll = () => {
    if (selected.size === subscribers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(subscribers.map((s) => s.id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setSendResult({ ok: false, msg: "Oggetto e corpo sono obbligatori." });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const subscriberIds = selected.size > 0 ? Array.from(selected) : [];
      const res = await adminFetch("/api/admin/newsletter/send", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, subscriberIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendResult({ ok: false, msg: data.error || "Errore durante l'invio" });
      } else {
        setSendResult({ ok: true, msg: `Inviata a ${data.sent} iscritti${data.failed > 0 ? `, ${data.failed} falliti` : ""}.` });
      }
    } catch {
      setSendResult({ ok: false, msg: "Errore di rete." });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Rimuovere questo iscritto?")) return;
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/newsletter/subscribers/${id}`, token, { method: "DELETE" });
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      loadSubscribers();
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = "w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#8B8680]";
  const recipientCount = selected.size > 0 ? selected.size : subscribers.length;

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-6">Newsletter</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Subscribers list */}
        <div className="bg-white border border-[#E8E3DC]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DC]">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#8B8680]" />
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Iscritti</h2>
            </div>
            <span className="text-xs text-[#8B8680]">{subscribers.length} totale</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-[#8B8680] text-center py-12">Nessun iscritto.</p>
          ) : (
            <div>
              <div className="flex items-center gap-3 px-6 py-3 border-b border-[#E8E3DC] bg-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={selected.size === subscribers.length && subscribers.length > 0}
                  onChange={toggleAll}
                  className="accent-[#2C2826]"
                />
                <span className="text-xs text-[#8B8680]">
                  {selected.size > 0 ? `${selected.size} selezionati` : "Seleziona tutti"}
                </span>
              </div>
              <div className="divide-y divide-[#E8E3DC] max-h-[500px] overflow-y-auto">
                {subscribers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="accent-[#2C2826] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2C2826] truncate">{s.email}</p>
                      <p className="text-xs text-[#8B8680]">
                        {s.firstName ? `${s.firstName} · ` : ""}
                        {(() => { try { return format(new Date(s.createdAt), "d MMM yyyy", { locale: it }); } catch { return s.createdAt; } })()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="text-red-400 hover:text-red-600 flex-shrink-0 disabled:opacity-50"
                    >
                      {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compose */}
        <div className="bg-white border border-[#E8E3DC]">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[#E8E3DC]">
            <Send size={16} className="text-[#8B8680]" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Componi newsletter</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-[#8B8680]">
              Destinatari: <strong className="text-[#2C2826]">{recipientCount}</strong> iscritti
              {selected.size > 0 && <span> (selezionati)</span>}
            </p>

            <div>
              <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Oggetto</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="Oggetto della newsletter..." />
            </div>

            <div>
              <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Corpo (HTML)</label>
              <p className="text-xs text-[#C5BEB8] mb-1">
                Variabili: <code className="bg-[#F5F2EE] px-1">{"{{firstName}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{email}}"}</code>
              </p>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                className={`${inputCls} resize-y font-mono text-xs`}
                placeholder="<p>Ciao {{firstName}},...</p>"
              />
            </div>

            {sendResult && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 ${sendResult.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {sendResult.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {sendResult.msg}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || subscribers.length === 0}
              className="w-full bg-[#2C2826] text-white text-sm py-2.5 hover:bg-[#3C3835] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? "Invio in corso..." : `Invia a ${recipientCount} iscritti`}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
