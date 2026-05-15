import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { KeyRound, Eye, EyeOff, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const DEFAULT_ORDER_SUBJECT = "Conferma ordine {{orderNumber}} — Lilo's Candle Design";
const DEFAULT_ORDER_BODY = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2826">
  <h1 style="font-size:24px;margin-bottom:8px">Grazie per il tuo ordine!</h1>
  <p style="color:#8B8680">Ordine <strong>{{orderNumber}}</strong></p>
  <p>Ciao {{customerName}},<br>abbiamo ricevuto il tuo ordine e lo stiamo preparando con cura.</p>
  <h2 style="font-size:16px;margin-top:24px;border-bottom:1px solid #E8E3DC;padding-bottom:8px">Riepilogo ordine</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="color:#8B8680"><th style="text-align:left;padding:4px">Prodotto</th><th style="text-align:center;padding:4px">Qtà</th><th style="text-align:right;padding:4px">Prezzo</th></tr></thead>
    <tbody>{{itemsHtml}}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding:8px 4px;text-align:right;color:#8B8680">Spedizione</td><td style="padding:8px 4px;text-align:right">€{{shippingAmount}}</td></tr>
      <tr><td colspan="2" style="padding:8px 4px;text-align:right;font-weight:bold">Totale</td><td style="padding:8px 4px;text-align:right;font-weight:bold">€{{totalAmount}}</td></tr>
    </tfoot>
  </table>
  <p style="margin-top:32px;color:#8B8680;font-size:13px">Lilo's Candle Design — candele artigianali</p>
</div>`;

const DEFAULT_NL_SUBJECT = "Novità da Lilo's Candle Design";
const DEFAULT_NL_BODY = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2826">
  <h1 style="font-size:22px">Ciao {{firstName}},</h1>
  <p>Scrivi qui il tuo messaggio...</p>
  <p style="margin-top:32px;color:#8B8680;font-size:12px">Hai ricevuto questa email perché sei iscritto alla newsletter di Lilo's Candle Design.</p>
</div>`;

export default function SettingsPage() {
  const { token, logout } = useAdminAuth();

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Email settings
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [orderSubject, setOrderSubject] = useState(DEFAULT_ORDER_SUBJECT);
  const [orderBody, setOrderBody] = useState(DEFAULT_ORDER_BODY);
  const [nlDefaultSubject, setNlDefaultSubject] = useState(DEFAULT_NL_SUBJECT);
  const [nlDefaultBody, setNlDefaultBody] = useState(DEFAULT_NL_BODY);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/email-settings", token)
      .then((r) => r.json())
      .then((data) => {
        if (data.smtp_host) setSmtpHost(data.smtp_host);
        if (data.smtp_port) setSmtpPort(data.smtp_port);
        if (data.smtp_user) setSmtpUser(data.smtp_user);
        if (data.smtp_pass) setSmtpPass(data.smtp_pass);
        if (data.smtp_from) setSmtpFrom(data.smtp_from);
        if (data.smtp_secure) setSmtpSecure(data.smtp_secure === "true");
        if (data.email_order_subject) setOrderSubject(data.email_order_subject);
        if (data.email_order_body) setOrderBody(data.email_order_body);
        if (data.email_newsletter_default_subject) setNlDefaultSubject(data.email_newsletter_default_subject);
        if (data.email_newsletter_default_body) setNlDefaultBody(data.email_newsletter_default_body);
      })
      .catch(() => {});
  }, [token]);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);
    if (newPassword !== confirmPassword) { setPwdError("Le due password non coincidono"); return; }
    if (newPassword.length < 8) { setPwdError("La nuova password deve essere di almeno 8 caratteri"); return; }
    setPwdLoading(true);
    try {
      const res = await adminFetch("/api/admin/change-password", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdError(data.error || "Errore"); return; }
      setPwdSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => logout(), 2000);
    } catch { setPwdError("Errore di rete."); }
    finally { setPwdLoading(false); }
  }

  async function handleEmailSave() {
    setEmailError(null); setEmailSuccess(false); setEmailLoading(true);
    try {
      const res = await adminFetch("/api/admin/email-settings", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser,
          smtp_pass: smtpPass, smtp_from: smtpFrom, smtp_secure: smtpSecure ? "true" : "false",
          email_order_subject: orderSubject, email_order_body: orderBody,
          email_newsletter_default_subject: nlDefaultSubject, email_newsletter_default_body: nlDefaultBody,
        }),
      });
      if (!res.ok) { const d = await res.json(); setEmailError(d.error || "Errore"); return; }
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch { setEmailError("Errore di rete."); }
    finally { setEmailLoading(false); }
  }

  async function handleTestSmtp() {
    setTestMsg(null); setTestLoading(true);
    try {
      const res = await adminFetch("/api/admin/email-settings/test", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost, port: smtpPort, secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass === "••••••••" ? undefined : smtpPass,
        }),
      });
      if (res.ok) { setTestMsg({ ok: true, msg: "Connessione SMTP riuscita!" }); }
      else { const d = await res.json(); setTestMsg({ ok: false, msg: d.error || "Errore" }); }
    } catch { setTestMsg({ ok: false, msg: "Errore di rete." }); }
    finally { setTestLoading(false); }
  }

  const inputCls = "w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#8B8680]";
  const labelCls = "block text-xs text-[#8B8680] mb-1.5";

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-8">Impostazioni</h1>

      <div className="max-w-2xl space-y-8">
        {/* Password */}
        <div className="bg-white border border-[#E8E3DC] p-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound size={16} className="text-[#8B8680]" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Cambia Password</h2>
          </div>
          {pwdSuccess ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
              Password aggiornata. Verrai disconnesso...
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Password attuale</label>
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={`${inputCls} pr-9`} />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C5BEB8] hover:text-[#2C2826]">
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Nuova password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={`${inputCls} pr-9`} />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C5BEB8] hover:text-[#2C2826]">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-xs text-[#C5BEB8] mt-1">Minimo 8 caratteri</p>
              </div>
              <div>
                <label className={labelCls}>Conferma nuova password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`${inputCls} pr-9`} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C5BEB8] hover:text-[#2C2826]">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {pwdError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{pwdError}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full bg-[#2C2826] text-white text-sm py-2.5 hover:bg-[#3C3835] disabled:opacity-50">
                {pwdLoading ? "Aggiornamento..." : "Aggiorna password"}
              </button>
            </form>
          )}
        </div>

        {/* Email / SMTP */}
        <div className="bg-white border border-[#E8E3DC] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail size={16} className="text-[#8B8680]" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Configurazione Email (SMTP)</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Server SMTP (host)</label>
                <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Porta</label>
                <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Utente (email)</label>
                <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="tua@email.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password / App password</label>
                <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email mittente (From)</label>
                <input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="Lilo's Candle <noreply@...>" className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input type="checkbox" id="smtpSecure" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
                <label htmlFor="smtpSecure" className="text-sm text-[#2C2826]">SSL/TLS (porta 465)</label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleTestSmtp} disabled={testLoading} className="text-sm border border-[#E8E3DC] text-[#8B8680] px-4 py-2 hover:border-[#8B8680] disabled:opacity-50 flex items-center gap-2">
                {testLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Testa connessione
              </button>
              {testMsg && (
                <span className={`flex items-center gap-1.5 text-sm ${testMsg.ok ? "text-green-600" : "text-red-600"}`}>
                  {testMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {testMsg.msg}
                </span>
              )}
            </div>

            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8B8680] pt-4 border-t border-[#E8E3DC]">
              Template email conferma ordine
            </h3>
            <p className="text-xs text-[#C5BEB8]">
              Variabili disponibili: <code className="bg-[#F5F2EE] px-1">{"{{orderNumber}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{customerName}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{totalAmount}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{shippingAmount}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{itemsHtml}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{shippingAddress}}"}</code>
            </p>
            <div>
              <label className={labelCls}>Oggetto</label>
              <input value={orderSubject} onChange={(e) => setOrderSubject(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Corpo (HTML)</label>
              <textarea value={orderBody} onChange={(e) => setOrderBody(e.target.value)} rows={10} className={`${inputCls} resize-y font-mono text-xs`} />
            </div>

            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8B8680] pt-4 border-t border-[#E8E3DC]">
              Template newsletter predefinito
            </h3>
            <p className="text-xs text-[#C5BEB8]">
              Variabili: <code className="bg-[#F5F2EE] px-1">{"{{firstName}}"}</code> <code className="bg-[#F5F2EE] px-1">{"{{email}}"}</code>
            </p>
            <div>
              <label className={labelCls}>Oggetto predefinito newsletter</label>
              <input value={nlDefaultSubject} onChange={(e) => setNlDefaultSubject(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Corpo predefinito newsletter (HTML)</label>
              <textarea value={nlDefaultBody} onChange={(e) => setNlDefaultBody(e.target.value)} rows={8} className={`${inputCls} resize-y font-mono text-xs`} />
            </div>

            {emailError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{emailError}</div>}
            {emailSuccess && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">Impostazioni salvate.</div>}

            <button onClick={handleEmailSave} disabled={emailLoading} className="bg-[#2C2826] text-white text-sm px-6 py-2.5 hover:bg-[#3C3835] disabled:opacity-50 flex items-center gap-2">
              {emailLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              Salva impostazioni email
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
