import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, Check } from "lucide-react";

interface PurchaseOption {
  qty: number;
  label: string;
  discount: number;
}

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
  soldOut: boolean;
  purchaseQuantities: PurchaseOption[];
  variants: Variant[];
}

const emptyProduct = {
  name: "", slug: "", description: "", shortDescription: "",
  price: "", imageUrl: "", images: "",
  size: "", material: "", burnTime: "", weight: "", dimensions: "",
  featured: false,
  soldOut: false,
  purchaseQuantities: [] as PurchaseOption[],
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
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // variant: null = closed, object = add new, or prefilled for edit
  const [variantForms, setVariantForms] = useState<Record<number, (typeof emptyVariant & { _editId?: number }) | null>>({});

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
      soldOut: p.soldOut,
      purchaseQuantities: p.purchaseQuantities ?? [],
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
      purchaseQuantities: form.purchaseQuantities,
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
    setDeleting(id);
    setDeleteError(null);
    try {
      const r = await adminFetch(`/api/admin/products/${id}`, token, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `Errore ${r.status}`);
      }
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      setDeleteError(e.message || "Errore durante l'eliminazione");
    } finally {
      setDeleting(null);
    }
  };

  const openAddVariant = (productId: number) => {
    setVariantForms((v) => ({ ...v, [productId]: { ...emptyVariant } }));
  };

  const openEditVariant = (productId: number, variant: Variant) => {
    setVariantForms((v) => ({
      ...v,
      [productId]: {
        color: variant.color,
        colorHex: variant.colorHex,
        aroma: variant.aroma,
        stock: String(variant.stock),
        imageUrl: variant.imageUrl || "",
        _editId: variant.id,
      },
    }));
  };

  const saveVariant = async (productId: number) => {
    const vf = variantForms[productId];
    if (!vf) return;
    const body = { color: vf.color, colorHex: vf.colorHex, aroma: vf.aroma, stock: parseInt(vf.stock), imageUrl: vf.imageUrl || null };
    if (vf._editId) {
      await adminFetch(`/api/admin/products/${productId}/variants/${vf._editId}`, token, {
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

  const toggleSoldOut = async (p: Product) => {
    await adminFetch(`/api/admin/products/${p.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ soldOut: !p.soldOut }),
    });
    load();
  };

  // Purchase quantities helpers
  const addPurchaseOption = () => {
    setForm((f) => ({
      ...f,
      purchaseQuantities: [...(f.purchaseQuantities as PurchaseOption[]), { qty: 1, label: "", discount: 0 }],
    }));
  };

  const updatePurchaseOption = (idx: number, field: keyof PurchaseOption, value: string | number) => {
    setForm((f) => {
      const pq = [...(f.purchaseQuantities as PurchaseOption[])];
      pq[idx] = { ...pq[idx], [field]: field === "label" ? value : Number(value) };
      return { ...f, purchaseQuantities: pq };
    });
  };

  const removePurchaseOption = (idx: number) => {
    setForm((f) => ({
      ...f,
      purchaseQuantities: (f.purchaseQuantities as PurchaseOption[]).filter((_, i) => i !== idx),
    }));
  };

  const inputCls = "w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#8B8680]";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-3xl text-[#2C2826]">Prodotti</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#2C2826] text-white px-5 py-2.5 text-sm hover:bg-[#3C3835]"
        >
          <Plus size={16} /> Nuovo prodotto
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded">
          {deleteError}
        </div>
      )}

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
                  {p.soldOut && (
                    <span className="text-xs bg-[#8B8680] text-white px-2 py-0.5 rounded">Esaurito</span>
                  )}
                  {p.purchaseQuantities?.length > 0 && (
                    <span className="text-xs bg-[#4A7C5B] text-white px-2 py-0.5 rounded">{p.purchaseQuantities.length} opzioni qtà</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSoldOut(p)}
                    className={`text-xs px-2 py-1 border transition-colors ${p.soldOut ? "border-[#8B8680] text-[#8B8680] hover:bg-[#8B8680] hover:text-white" : "border-[#E8E3DC] text-[#8B8680] hover:border-[#8B8680]"}`}
                    title={p.soldOut ? "Segna come disponibile" : "Segna come esaurito"}
                  >
                    {p.soldOut ? "Disponibile" : "Esaurito"}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-[#8B8680] hover:text-[#2C2826] p-2">
                    <Pencil size={16} />
                  </button>
                  {confirmDelete === p.id ? (
                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded">
                      <span className="text-xs text-red-600 mr-1">Sicuro?</span>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        disabled={deleting === p.id}
                        className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting === p.id ? "..." : "Sì, elimina"}
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                        className="text-xs text-[#8B8680] px-2 py-0.5 hover:text-[#2C2826]"
                      >
                        Annulla
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDelete(p.id); setDeleteError(null); }}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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
                      onClick={() => openAddVariant(p.id)}
                      className="text-xs text-[#7C6B8A] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Aggiungi variante
                    </button>
                  </div>
                  <div className="space-y-2">
                    {p.variants.map((v) => (
                      <div key={v.id}>
                        {variantForms[p.id]?._editId === v.id ? (
                          <VariantForm
                            vf={variantForms[p.id]!}
                            onChange={(vf) => setVariantForms((prev) => ({ ...prev, [p.id]: vf }))}
                            onSave={() => saveVariant(p.id)}
                            onCancel={() => setVariantForms((prev) => ({ ...prev, [p.id]: null }))}
                            inputCls={inputCls}
                            isEdit
                          />
                        ) : (
                          <div className="flex items-center justify-between bg-[#FAF8F5] px-4 py-2 text-sm">
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
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditVariant(p.id, v)}
                                className="text-[#8B8680] hover:text-[#2C2826] p-1"
                                title="Modifica variante"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => deleteVariant(p.id, v.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add new variant form (only when _editId is undefined) */}
                    {variantForms[p.id] && !variantForms[p.id]?._editId && (
                      <VariantForm
                        vf={variantForms[p.id]!}
                        onChange={(vf) => setVariantForms((prev) => ({ ...prev, [p.id]: vf }))}
                        onSave={() => saveVariant(p.id)}
                        onCancel={() => setVariantForms((prev) => ({ ...prev, [p.id]: null }))}
                        inputCls={inputCls}
                        isEdit={false}
                      />
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
                <div className="flex flex-col gap-3 pt-5">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="featured" checked={form.featured as boolean} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                    <label htmlFor="featured" className="text-sm text-[#2C2826]">In evidenza nella homepage</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="soldOut" checked={form.soldOut as boolean} onChange={(e) => setForm((f) => ({ ...f, soldOut: e.target.checked }))} />
                    <label htmlFor="soldOut" className="text-sm text-[#2C2826]">Esaurito</label>
                  </div>
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

              {/* Purchase quantity options */}
              <div className="border-t border-[#E8E3DC] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em]">Opzioni quantità acquisto</label>
                  <button
                    type="button"
                    onClick={addPurchaseOption}
                    className="text-xs text-[#7C6B8A] hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Aggiungi opzione
                  </button>
                </div>
                <p className="text-xs text-[#C5BEB8] mb-3">
                  Definisci quantità fisse acquistabili (es. 1 candela, box da 3) con eventuale sconto percentuale.
                  Lasciare vuoto per acquisto libero.
                </p>
                {(form.purchaseQuantities as PurchaseOption[]).length === 0 ? (
                  <p className="text-xs text-[#C5BEB8] italic">Nessuna opzione — acquisto libero</p>
                ) : (
                  <div className="space-y-2">
                    {(form.purchaseQuantities as PurchaseOption[]).map((opt, idx) => (
                      <div key={idx} className="grid grid-cols-[80px_1fr_100px_32px] gap-2 items-center bg-[#FAF8F5] p-3">
                        <div>
                          <label className="text-xs text-[#8B8680] block mb-1">Quantità</label>
                          <input
                            type="number"
                            min="1"
                            value={opt.qty}
                            onChange={(e) => updatePurchaseOption(idx, "qty", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#8B8680] block mb-1">Etichetta</label>
                          <input
                            value={opt.label}
                            onChange={(e) => updatePurchaseOption(idx, "label", e.target.value)}
                            placeholder="es. Box da 3"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#8B8680] block mb-1">Sconto %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={opt.discount}
                            onChange={(e) => updatePurchaseOption(idx, "discount", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePurchaseOption(idx)}
                          className="text-red-400 hover:text-red-600 mt-5"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

// Extracted variant form component to avoid repetition
function VariantForm({
  vf, onChange, onSave, onCancel, inputCls, isEdit,
}: {
  vf: { color: string; colorHex: string; aroma: string; stock: string; imageUrl: string; _editId?: number };
  onChange: (vf: any) => void;
  onSave: () => void;
  onCancel: () => void;
  inputCls: string;
  isEdit: boolean;
}) {
  return (
    <div className="bg-[#F0EBE3] p-4 space-y-3">
      <p className="text-xs text-[#8B8680] uppercase tracking-[0.15em]">{isEdit ? "Modifica variante" : "Nuova variante"}</p>
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Colore (es. Grigio cemento)"
          value={vf.color}
          onChange={(e) => onChange({ ...vf, color: e.target.value })}
          className={inputCls}
        />
        <div className="flex gap-2">
          <input
            type="color"
            value={vf.colorHex}
            onChange={(e) => onChange({ ...vf, colorHex: e.target.value })}
            className="h-10 w-12 border border-[#E8E3DC] cursor-pointer p-1"
          />
          <input
            placeholder="HEX"
            value={vf.colorHex}
            onChange={(e) => onChange({ ...vf, colorHex: e.target.value })}
            className={`${inputCls} flex-1`}
          />
        </div>
        <input
          placeholder="Aroma (es. Vaniglia)"
          value={vf.aroma}
          onChange={(e) => onChange({ ...vf, aroma: e.target.value })}
          className={inputCls}
        />
        <input
          type="number"
          placeholder="Stock"
          value={vf.stock}
          onChange={(e) => onChange({ ...vf, stock: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Immagine URL (opzionale)"
          value={vf.imageUrl}
          onChange={(e) => onChange({ ...vf, imageUrl: e.target.value })}
          className={`${inputCls} col-span-2`}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-sm text-[#8B8680] px-4 py-2 border border-[#E8E3DC] bg-white hover:border-[#8B8680]"
        >
          Annulla
        </button>
        <button
          onClick={onSave}
          className="text-sm bg-[#2C2826] text-white px-5 py-2 hover:bg-[#3C3835] flex items-center gap-2"
        >
          <Check size={14} /> {isEdit ? "Aggiorna variante" : "Salva variante"}
        </button>
      </div>
    </div>
  );
}
