import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useLocation } from "wouter";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Password errata.");
        return;
      }
      const { token } = await res.json();
      login(token);
      navigate("/admin/dashboard");
    } catch {
      setError("Errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-[#2C2826] mb-2">LilosCandle</h1>
          <p className="text-sm text-[#8B8680]">Area amministrativa</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#E8E3DC] p-8">
          <h2 className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-6">Accedi</h2>
          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-[#E8E3DC] px-4 py-3 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#8B8680] mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C2826] text-white py-3 text-sm uppercase tracking-[0.2em] hover:bg-[#3C3835] transition-colors disabled:opacity-50"
          >
            {loading ? "Accesso..." : "Entra"}
          </button>
        </form>
      </div>
    </div>
  );
}
