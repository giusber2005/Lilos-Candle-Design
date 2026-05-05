import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";

interface AdminComment {
  id: number;
  name: string;
  message: string;
  rating: number;
  createdAt: string;
}

export default function CommentsPage() {
  const { token } = useAdminAuth();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadComments = () => {
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/comments", token)
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(typeof body?.error === "string" ? body.error : "Impossibile caricare i commenti.");
        }
        return response.json();
      })
      .then((rows: AdminComment[]) => {
        setComments(rows);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Errore nel caricamento dei commenti.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(loadComments, [token]);

  const deleteComment = async (id: number) => {
    if (!confirm("Eliminare questo commento?")) return;

    setDeleting(id);
    setError(null);
    try {
      const response = await adminFetch(`/api/admin/comments/${id}`, token, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "Impossibile eliminare il commento.");
      }
      setComments((prev) => prev.filter((comment) => comment.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-8">Commenti</h1>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white border border-[#E8E3DC] p-8 text-center text-sm text-[#8B8680]">
          Nessun commento disponibile.
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-[#E8E3DC] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[#2C2826]">{comment.name}</p>
                  <p className="text-xs text-[#8B8680]">
                    {new Date(comment.createdAt).toLocaleString("it-IT")}
                  </p>
                </div>
                <button
                  onClick={() => deleteComment(comment.id)}
                  disabled={deleting === comment.id}
                  className="text-[#8B8680] hover:text-red-600 p-2 disabled:opacity-50"
                  title="Elimina commento"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex gap-1 my-3">
                {Array.from({ length: comment.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="#7C6B8A" stroke="none" />
                ))}
              </div>

              <p className="text-sm text-[#2C2826] leading-relaxed">{comment.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
