import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const { token, logout } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Le due password non coincidono");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nuova password deve essere di almeno 8 caratteri");
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/change-password", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante il cambio password");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Log out after password change so the user logs in with the new password
      setTimeout(() => logout(), 2000);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-8">Impostazioni</h1>

      <div className="max-w-md">
        <div className="bg-white border border-[#E8E3DC] p-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound size={16} className="text-[#8B8680]" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Cambia Password</h2>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
              Password aggiornata con successo. Verrai disconnesso...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="block text-xs text-[#8B8680] mb-1.5">Password attuale</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#2C2826] pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C5BEB8] hover:text-[#2C2826]"
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs text-[#8B8680] mb-1.5">Nuova password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#2C2826] pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C5BEB8] hover:text-[#2C2826]"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-xs text-[#C5BEB8] mt-1">Minimo 8 caratteri</p>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs text-[#8B8680] mb-1.5">Conferma nuova password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#2C2826] pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C5BEB8] hover:text-[#2C2826]"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2C2826] text-white text-sm py-2.5 hover:bg-[#3C3835] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Aggiornamento..." : "Aggiorna password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-[#C5BEB8] mt-4">
          La password viene salvata nelle variabili d'ambiente di Railway e applicata immediatamente.
          Dopo il cambio verrai disconnesso automaticamente.
        </p>
      </div>
    </AdminLayout>
  );
}
