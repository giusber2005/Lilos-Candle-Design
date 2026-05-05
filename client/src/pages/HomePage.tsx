import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Star, ChevronDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useContent, useJsonContent } from "@/lib/content-context";

type Review = { name: string; text: string; rating: number };
type UserComment = { id: number; name: string; message: string; createdAt: string };

function CandlePlaceholder({ size = "large", color = "#7C6B8A" }: { size?: "large" | "small"; color?: string }) {
  const w = size === "large" ? 200 : 120;
  const h = size === "large" ? 220 : 132;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={w} height={h} rx="4" fill="url(#cement)" />
      <rect x="16" y="16" width={w - 32} height={h * 0.35} rx="2" fill={color} fillOpacity="0.85" />
      <defs>
        <linearGradient id="cement" x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C5BEB8" />
          <stop offset="40%" stopColor="#D8D2CB" />
          <stop offset="70%" stopColor="#BDB6AE" />
          <stop offset="100%" stopColor="#A89E96" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const defaultProcessSteps = [
  { n: "01", title: "Il vaso", desc: "Modellato in cemento puro, con texture naturale." },
  { n: "02", title: "La cera", desc: "Cera di alta qualità, colorata a mano." },
  { n: "03", title: "Il profumo", desc: "Fragranze selezionate, intense e durature." },
  { n: "04", title: "La cura", desc: "Ogni pezzo è rifinito singolarmente." },
];

const defaultReviews: Review[] = [
  { name: "Giulia M.", text: "Semplicemente bellissima. L'aroma di amarena è delicato e avvolgente. Il design in cemento è unico nel suo genere.", rating: 5 },
  { name: "Marco T.", text: "Ho regalato la Big Boy ad una amica — era entusiasta. La qualità è eccezionale, si vede che è fatta con cura.", rating: 5 },
  { name: "Sofia R.", text: "La Lil One è perfetta per la mia scrivania. Piccola ma intensa. Tornerò sicuramente ad acquistare.", rating: 5 },
];

export default function HomePage() {
  useScrollReveal();
  const c = useContent();
  const processSteps = useJsonContent("process_steps", defaultProcessSteps);
  const reviews = useJsonContent<Review>("reviews", defaultReviews);

  const [featuredProducts, setFeaturedProducts] = useState<{ id: number; name: string; slug: string; shortDescription: string; price: number; imageUrl: string | null; featured: boolean }[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((all: { id: number; name: string; slug: string; shortDescription: string; price: number; imageUrl: string | null; featured: boolean }[]) => {
        const featured = all.filter((p) => p.featured);
        setFeaturedProducts((featured.length > 0 ? featured : all).slice(0, 2));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/comments")
      .then((r) => {
        if (!r.ok) throw new Error("Unable to load comments");
        return r.json();
      })
      .then((rows: UserComment[]) => {
        setUserComments(rows);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentStatus, setCommentStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
    } catch {
      setSubscribed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = commentMessage.trim();
    if (!message) {
      setCommentStatus({ type: "error", message: "Scrivi un commento prima di inviare." });
      return;
    }

    setCommentSubmitting(true);
    setCommentStatus({ type: "idle", message: "" });
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: commentName.trim(),
          message,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage = typeof errorBody?.error === "string" ? errorBody.error : "Impossibile inviare il commento.";
        throw new Error(errorMessage);
      }

      const createdComment = (await response.json()) as UserComment;
      setUserComments((prev) => [createdComment, ...prev].slice(0, 20));
      setCommentMessage("");
      setCommentName("");
      setCommentStatus({ type: "success", message: "Commento inviato con successo." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante l'invio del commento.";
      setCommentStatus({ type: "error", message });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const allReviews: Review[] = [
    ...userComments.map((comment) => ({
      name: comment.name,
      text: comment.message,
      rating: 5,
    })),
    ...reviews,
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, #2C2826 0%, #3D3530 40%, #4A3D35 70%, #5C4A40 100%)" }}
        />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #7C6B8A 0%, transparent 60%)" }}
        />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-[#C5BEB8] text-xs uppercase tracking-[0.4em] mb-8 font-light">
            {c["hero_badge"] || "Artigianale · Italiana"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-8">
            {c["hero_title_1"] || "Luce."}
            <br />
            <span className="italic text-[#C5BEB8]">{c["hero_title_2"] || "Profumo."}</span>
            <br />
            {c["hero_title_3"] || "Artigianato."}
          </h1>
          <p className="text-[#A89E96] text-lg md:text-xl max-w-xl mx-auto mb-12 font-light leading-relaxed">
            {c["hero_subtitle"] || "Candele fatte a mano in vaso di cemento. Un design geometrico e minimalista che porta luce e calore nei tuoi spazi."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <button className="group bg-white text-[#2C2826] px-8 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-[#F0EBE3] transition-all duration-300 flex items-center gap-3 rounded-none">
                {c["hero_cta_primary"] || "Scopri le candele"}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/products">
              <button className="border border-white/40 text-white px-8 py-4 text-sm uppercase tracking-[0.15em] font-light hover:bg-white/10 transition-all duration-300 rounded-none">
                {c["hero_cta_secondary"] || "Shop Now"}
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Product teaser */}
      <section className="py-28 px-6 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">
              {c["collection_eyebrow"] || "Le nostre candele"}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#2C2826]">
              {c["collection_title"] || "Collezione Corrente"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {featuredProducts.map((p, i) => (
              <Link key={p.slug} href={`/products/${p.slug}`}>
                <div className={`group cursor-pointer reveal reveal-delay-${i + 1}`}>
                  <div className="bg-[#F0EBE3] aspect-[4/5] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:shadow-[var(--shadow-lg)]">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="transform group-hover:scale-105 transition-transform duration-700">
                        <CandlePlaceholder size={i === 0 ? "large" : "small"} />
                      </div>
                    )}
                  </div>
                  <div className="pt-6 pb-2 flex items-end justify-between">
                    <div>
                      <h3 className="font-serif text-2xl text-[#2C2826]">{p.name}</h3>
                      <p className="text-sm text-[#8B8680] mt-1 font-light">{p.shortDescription}</p>
                    </div>
                    <span className="font-serif text-xl text-[#2C2826]">€ {p.price.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-14 reveal">
            <Link href="/products">
              <button className="group border border-[#2C2826] text-[#2C2826] px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#2C2826] hover:text-white transition-all duration-300 flex items-center gap-3 mx-auto rounded-none">
                Vedi tutti i prodotti
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="py-28 px-6 bg-[#2C2826]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-6">
              {c["brand_story_eyebrow"] || "Chi siamo"}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight mb-8">
              {c["brand_story_title"] || "Ogni candela racconta una storia."}
            </h2>
            <p className="text-[#8B8680] text-lg leading-relaxed mb-6 font-light">
              {c["brand_story_p1"] || "Nasce dall'amore per il design e il profumo. Ogni candela LilosCandle è modellata in un contenitore cubico di cemento fatto a mano, riempito con cera naturale e fragranze selezionate."}
            </p>
            <p className="text-[#8B8680] leading-relaxed font-light">
              {c["brand_story_p2"] || "Il cemento — materiale grezzo e moderno — incontra la morbidezza della cera colorata per creare un oggetto unico, capace di trasformare qualsiasi ambiente."}
            </p>
            <Link href="/about">
              <button className="group mt-10 flex items-center gap-3 text-white text-sm uppercase tracking-[0.2em] font-light hover:text-[#C5BEB8] transition-colors">
                {c["brand_story_cta"] || "La nostra storia"}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
          <div className="reveal reveal-delay-2 grid grid-cols-2 gap-4">
            <div className="bg-[#3C3835] aspect-square flex items-center justify-center">
              <CandlePlaceholder size="large" />
            </div>
            <div className="bg-[#3C3835] aspect-square flex items-center justify-center mt-8">
              <CandlePlaceholder size="small" />
            </div>
          </div>
        </div>
      </section>

      {/* Process teaser */}
      <section className="py-28 px-6 bg-[#F0EBE3]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4 reveal">
            {c["process_eyebrow"] || "Il processo"}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#2C2826] mb-16 reveal">
            {c["process_title"] || "Fatte con cura, una alla volta."}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <div key={step.n} className={`reveal reveal-delay-${i + 1}`}>
                <div className="font-serif text-5xl text-[#C5BEB8] mb-4">{step.n}</div>
                <h3 className="font-serif text-xl text-[#2C2826] mb-2">{step.title}</h3>
                <p className="text-sm text-[#8B8680] font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 reveal">
            <Link href="/how-made">
              <button className="group flex items-center gap-3 text-[#2C2826] text-sm uppercase tracking-[0.2em] font-light hover:text-[#7C6B8A] transition-colors mx-auto">
                Scopri il processo
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-28 px-6 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">
              {c["reviews_eyebrow"] || "Recensioni"}
            </p>
            <h2 className="font-serif text-4xl text-[#2C2826]">
              {c["reviews_title"] || "Cosa dicono di noi"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {allReviews.map((r, i) => (
              <div key={`${r.name}-${i}`} className={`reveal reveal-delay-${Math.min(i + 1, 6)} bg-[#F0EBE3] p-8`}>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#7C6B8A" stroke="none" />
                  ))}
                </div>
                <p className="text-[#2C2826] leading-relaxed mb-6 font-light italic font-serif">
                  "{r.text}"
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">{r.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 max-w-2xl mx-auto reveal">
            <form onSubmit={handleCommentSubmit} className="bg-[#F0EBE3] p-8 flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Lascia un commento</p>
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="Il tuo nome (opzionale)"
                className="bg-[#FAF8F5] border border-[#D8D2CB] text-[#2C2826] placeholder-[#8B8680] px-4 py-3 focus:outline-none focus:border-[#7C6B8A]"
                maxLength={80}
              />
              <textarea
                value={commentMessage}
                onChange={(e) => setCommentMessage(e.target.value)}
                placeholder="Scrivi qui il tuo commento..."
                className="min-h-28 bg-[#FAF8F5] border border-[#D8D2CB] text-[#2C2826] placeholder-[#8B8680] px-4 py-3 focus:outline-none focus:border-[#7C6B8A] resize-y"
                maxLength={600}
                required
              />
              <button
                type="submit"
                disabled={commentSubmitting}
                className="self-start bg-[#7C6B8A] text-white px-6 py-3 text-sm uppercase tracking-[0.15em] hover:bg-[#6B5A79] transition-colors disabled:opacity-50"
              >
                {commentSubmitting ? "Invio..." : "Invia commento"}
              </button>
              {commentStatus.type !== "idle" && (
                <p className={commentStatus.type === "success" ? "text-sm text-[#3F6D47]" : "text-sm text-[#8A3D3D]"}>
                  {commentStatus.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-28 px-6 bg-[#2C2826]">
        <div className="max-w-2xl mx-auto text-center reveal">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">
            {c["newsletter_eyebrow"] || "Newsletter"}
          </p>
          <h2 className="font-serif text-4xl text-white mb-6">
            {c["newsletter_title"] || "Sii il primo a sapere."}
          </h2>
          <p className="text-[#8B8680] mb-10 font-light">
            {c["newsletter_subtitle"] || "Nuovi aromi, nuove collezioni e offerte riservate agli iscritti."}
          </p>
          {subscribed ? (
            <div className="border border-[#7C6B8A] px-8 py-4 text-[#C5BEB8] font-serif italic">
              {c["newsletter_success"] || "Grazie! Sei iscritto alla nostra newsletter."}
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                className="flex-1 bg-[#3C3835] border border-[#4A3D35] text-white placeholder-[#6B6560] px-6 py-4 focus:outline-none focus:border-[#7C6B8A] transition-colors"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#7C6B8A] text-white px-8 py-4 text-sm uppercase tracking-[0.15em] hover:bg-[#6B5A79] transition-colors disabled:opacity-50"
              >
                {submitting ? "..." : (c["newsletter_button"] || "Iscriviti")}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
