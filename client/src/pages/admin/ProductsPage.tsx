import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";

interface Variant {
  id: number;
  productId: number;
  color: string;
  colorHex: string;
  aroma: string;
  stock: number;
  imageUrl: string | null;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  imageUrl: string | null;
  images: string[];
  size: string;
  material: string;
  burnTime: string;
  weight: string;
  dimensions: string;
  featured: boolean;
  variants: Variant[];
}

const emptyProduct = {
  name: "", slug: "", description: "", shortDescription: "",
  price: "", imageUrl: "", images: "",
  size: "", material: "", burnTime: "", weight: "", dimensions: "",
  featured: false,
};

const emptyVariant = { color: "", colorHex: "#C5BEB8", aroma: "", stock: "0", imageUrl: "" };

export default function ProductsPage() {
  const { token } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState(false);
  const [variantForms, setVariantForms] = useState<Record<number, typeof emptyVariant | null>>({});

  const load = () => {
    setLoading(true);
    adminFetch("/api/admin/products", token)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const openNew = () => {
    setEditProduct(null);
    setForm({ ...emptyProduct });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description,
      shortDescription: p.shortDescription, price: String(p.price),
      imageUrl: p.imageUrl || "", images: p.images.join(", "),
      size: p.size, material: p.material, burnTime: p.burnTime,
      weight: p.weight, dimensions: p.dimensions, featured: p.featured,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      ...form,
      price: parseFloat(form.price as string),
      images: (form.images as string).split(",").map((s) => s.trim()).filter(Boolean),
      imageUrl: form.imageUrl || null,
    };
    try {
      if (editProduct) {
        await adminFetch(`/api/admin/products/${editProduct.id}`, token, {
          method: "PATCH", body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/api/admin/products", token, {
          method: "POST", body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Eliminare il prodotto e tutte le sue varianti?")) return;
    await adminFetch(`/api/admin/products/${id}`, token, { method: "DELETE" });
    load();
  };

  const saveVariant = async (productId: number, variantId?: number) => {
    const vf = variantForms[productId];
    if (!vf) return;
    const body = { ...vf, stock: parseInt(vf.stock), imageUrl: vf.imageUrl || null };
    if (variantId) {
      await adminFetch(`/api/admin/products/${productId}/variants/${variantId}`, token, {
        method: "PATCH", body: JSON.stringify(body),
      });
    } else {
      await adminFetch(`/api/admin/products/${productId}/variants`, token, {
        method: "POST", body: JSON.stringify(body),
      });
    }
    setVariantForms((p) => ({ ...p, [productId]: null }));
    load();
  };

  const deleteVariant = async (productId: number, variantId: number) => {
    if (!confirm("Eliminare questa variante?")) return;
    await adminFetch(`/api/admin/products/${productId}/variants/${variantId}`, token, { method: "DELETE" });
    load();
  };

  const inputCls = "w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#8B8680]";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[#2C2826]">Prodotti</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#2C2826] text-white px-5 py-2.5 text-sm hover:bg-[#3C3835]"
        >
          <Plus size={16} /> Nuovo prodotto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-[#E8E3DC]">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-12 h-12 object-cover border border-[#E8E3DC]"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-[#2C2826]">{p.name}</p>
                    <p className="text-xs text-[#8B8680]">€ {p.price.toFixed(2)} · {p.variants.length} varianti · {p.slug}</p>
                  </div>
                  {p.featured && (
                    <span className="text-xs bg-[#7C6B8A] text-white px-2 py-0.5 rounded">In evidenza</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(p)} className="text-[#8B8680] hover:text-[#2C2826] p-2">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
                    className="text-[#8B8680] hover:text-[#2C2826] p-2"
                  >
                    {expanded[p.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {expanded[p.id] && (
                <div className="border-t border-[#E8E3DC] px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Varianti</p>
                    <button
                      onClick={() => setVariantForms((v) => ({ ...v, [p.id]: { ...emptyVariant } }))}
                      className="text-xs text-[#7C6B8A] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Aggiungi variante
                    </button>
                  </div>
                  <div className="space-y-2">
                    {p.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-[#FAF8F5] px-4 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-5 h-5 rounded-full border border-[#E8E3DC] flex-shrink-0"
                            style={{ background: v.colorHex }}
                          />
                          <span className="text-[#2C2826]">{v.color}</span>
                          <span className="text-[#8B8680]">·</span>
                          <span className="text-[#8B8680]">{v.aroma}</span>
                          <span className="text-[#8B8680]">·</span>
                          <span className="text-[#8B8680]">Stock: {v.stock}</span>
                        </div>
                        <button
                          onClick={() => deleteVariant(p.id, v.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {variantForms[p.id] && (
                      <div className="bg-[#F0EBE3] p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            placeholder="Colore (es. Grigio cemento)"
                            value={variantForms[p.id]!.color}
                            onChange={(e) => setVariantForms((v) => ({ ...v, [p.id]: { ...v[p.id]!, color: e.target.value } }))}
                            className={inputCls}
                          />
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={variantForms[p.id]!.colorHex}
                              onChange={(e) => setVariantForms((v) => ({ ...v, [p.id]: { ...v[p.id]!, colorHex: e.target.value } }))}
                              className="h-10 w-12 border border-[#E8E3DC] cursor-pointer p-1"
                            />
                            <input
                              placeholder="HEX"
                              value={variantForms[p.id]!.colorHex}
                              onChange={(e) => setVariantForms((v) => ({ ...v, [p.id]: { ...v[p.id]!, colorHex: e.target.value } }))}
                              className={`${inputCls} flex-1`}
                            />
                          </div>
                          <input
                            placeholder="Aroma (es. Vaniglia)"
                            value={variantForms[p.id]!.aroma}
                            onChange={(e) => setVariantForms((v) => ({ ...v, [p.id]: { ...v[p.id]!, aroma: e.target.value } }))}
                            className={inputCls}
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={variantForms[p.id]!.stock}
                            onChange={(e) => setVariantForms((v) => ({ ...v, [p.id]: { ...v[p.id]!, stock: e.target.value } }))}
                            className={inputCls}
                          />
                          <input
                            placeholder="Immagine URL (opzionale)"
                            value={variantForms[p.id]!.imageUrl}
                            onChange={(e) => setVariantForms((v) => ({ ...v, [p.id]: { ...v[p.id]!, imageUrl: e.target.value } }))}
                            className={`${inputCls} col-span-2`}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setVariantForms((v) => ({ ...v, [p.id]: null }))}
                            className="text-sm text-[#8B8680] px-4 py-2 border border-[#E8E3DC] bg-white hover:border-[#8B8680]"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => saveVariant(p.id)}
                            className="text-sm bg-[#2C2826] text-white px-5 py-2 hover:bg-[#3C3835]"
                          >
                            Salva variante
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-5 border-b border-[#E8E3DC]">
              <h2 className="font-serif text-xl text-[#2C2826]">
                {editProduct ? "Modifica prodotto" : "Nuovo prodotto"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#8B8680] hover:text-[#2C2826]">
                <X size={20} />
              </button>
            </div>
            <div className="px-8 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Nome *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={inputCls} placeholder="es. big-boy" />
                </div>
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Prezzo (€) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input type="checkbox" id="featured" checked={form.featured as boolean} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                  <label htmlFor="featured" className="text-sm text-[#2C2826]">In evidenza nella homepage</label>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Descrizione breve *</label>
                <input value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Descrizione *</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} className={`${inputCls} resize-y`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Dimensione *</label>
                  <input value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} className={inputCls} placeholder="es. Grande" />
                </div>
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Materiale *</label>
                  <input value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} className={inputCls} placeholder="es. Vaso di cemento" />
                </div>
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Durata fiamma *</label>
                  <input value={form.burnTime} onChange={(e) => setForm((f) => ({ ...f, burnTime: e.target.value }))} className={inputCls} placeholder="es. 60 ore" />
                </div>
                <div>
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Peso *</label>
                  <input value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} className={inputCls} placeholder="es. 500g" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Dimensioni *</label>
                  <input value={form.dimensions} onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))} className={inputCls} placeholder="es. 10×12 cm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Immagine principale (URL)</label>
                <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className={inputCls} placeholder="https://..." />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl as string}
                    alt="Anteprima"
                    className="mt-2 h-24 object-cover border border-[#E8E3DC]"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
              </div>
              <div>
                <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Galleria immagini (URL separati da virgola)</label>
                <input value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} className={inputCls} placeholder="https://..., https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-8 py-5 border-t border-[#E8E3DC]">
              <button onClick={() => setShowForm(false)} className="text-sm text-[#8B8680] px-4 py-2 border border-[#E8E3DC] hover:border-[#8B8680]">
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-[#2C2826] text-white px-6 py-2 hover:bg-[#3C3835] disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : editProduct ? "Aggiorna" : "Crea prodotto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
