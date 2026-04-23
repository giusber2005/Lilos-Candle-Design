import { useEffect, useState, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { Check, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

interface ContentRow {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  section: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "🏠 Hero (homepage principale)",
  homepage: "📄 Homepage — sezioni",
  newsletter: "📧 Newsletter",
  about: "ℹ️ Chi siamo",
  howmade: "🕯️ Come sono fatte",
  brand: "🏷️ Brand & identità",
  social: "📱 Social media",
  shop: "🛍️ Pagina shop",
  policies: "📦 Spedizioni e politiche",
};

function JsonEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pretty, setPretty] = useState(() => {
    try { return JSON.stringify(JSON.parse(value), null, 2); }
    catch { return value; }
  });

  const handleChange = (raw: string) => {
    setPretty(raw);
    try {
      JSON.parse(raw);
      setError(null);
      onChange(raw);
    } catch {
      setError("JSON non valido — le modifiche non vengono salvate finché il formato è corretto");
    }
  };

  const format = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(pretty), null, 2);
      setPretty(formatted);
      onChange(formatted);
      setError(null);
    } catch {
      setError("Impossibile formattare: JSON non valido");
    }
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#8B8680]">Array JSON — modifica direttamente</span>
        <button
          type="button"
          onClick={format}
          className="text-xs text-[#8B8680] hover:text-[#2C2826] underline"
        >
          Formatta
        </button>
      </div>
      <textarea
        value={pretty}
        onChange={(e) => handleChange(e.target.value)}
        rows={12}
        className="w-full border border-[#E8E3DC] px-4 py-3 text-xs text-[#2C2826] font-mono focus:outline-none focus:border-[#8B8680] resize-y bg-[#FAFAF8]"
        spellCheck={false}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function ContentField({
  row,
  value,
  onChange,
  onSave,
  saving,
  saved,
}: {
  row: ContentRow;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[#2C2826] block mb-1">{row.label}</label>
      <p className="text-xs text-[#C5BEB8] mb-2 font-mono">{row.key}</p>
      <div className="flex gap-3 items-start">
        {row.type === "json" ? (
          <JsonEditor value={value} onChange={onChange} />
        ) : row.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="flex-1 border border-[#E8E3DC] px-4 py-3 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#8B8680] resize-y"
          />
        ) : (
          <input
            type={row.type === "image" || row.type === "link" ? "url" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={row.type === "image" || row.type === "link" ? "https://..." : ""}
            className="flex-1 border border-[#E8E3DC] px-4 py-3 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#8B8680]"
          />
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-shrink-0 bg-[#2C2826] text-white px-4 py-3 text-sm hover:bg-[#3C3835] transition-colors disabled:opacity-50 flex items-center gap-2 mt-0"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : "Salva"}
        </button>
      </div>
      {row.type === "image" && value && (
        <img src={value} alt={row.label} className="mt-2 h-20 object-cover border border-[#E8E3DC]" />
      )}
    </div>
  );
}

export default function ContentPage() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    adminFetch("/api/admin/content", token)
      .then((r) => r.json())
      .then((data: ContentRow[]) => {
        setRows(data);
        const initial: Record<string, string> = {};
        for (const r of data) initial[r.key] = r.value;
        setValues(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const save = useCallback(async (key: string) => {
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await adminFetch(`/api/admin/content/${key}`, token, {
        method: "PATCH",
        body: JSON.stringify({ value: values[key] }),
      });
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2500);
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  }, [token, values]);

  const toggleSection = (section: string) => {
    setCollapsed((p) => ({ ...p, [section]: !p[section] }));
  };

  const sections = [...new Set(rows.map((r) => r.section))];

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-2">Contenuti del sito</h1>
      <p className="text-sm text-[#8B8680] mb-8">
        Modifica tutti i testi, le immagini e i link del sito. Le sezioni con icona{" "}
        <span className="font-mono bg-[#F0EBE3] px-1">JSON</span> usano array — non modificare la struttura, solo i valori.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-[#E8E3DC] p-8 text-center">
          <p className="text-sm text-[#8B8680] mb-4">
            Nessun contenuto trovato. Esegui il seed del database.
          </p>
          <p className="text-xs text-[#C5BEB8] font-mono bg-[#F0EBE3] inline-block px-3 py-2">
            pnpm db:seed
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const sectionRows = rows.filter((r) => r.section === section);
            const isOpen = !collapsed[section];
            const label = SECTION_LABELS[section] ?? section;

            return (
              <div key={section} className="bg-white border border-[#E8E3DC]">
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between p-5 hover:bg-[#FAFAF8] transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-[#2C2826]">{label}</span>
                  <span className="flex items-center gap-2 text-xs text-[#8B8680]">
                    {sectionRows.length} campi
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-[#E8E3DC] p-6 space-y-6">
                    {sectionRows.map((row) => (
                      <ContentField
                        key={row.key}
                        row={row}
                        value={values[row.key] ?? ""}
                        onChange={(v) => setValues((p) => ({ ...p, [row.key]: v }))}
                        onSave={() => save(row.key)}
                        saving={!!saving[row.key]}
                        saved={!!saved[row.key]}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
