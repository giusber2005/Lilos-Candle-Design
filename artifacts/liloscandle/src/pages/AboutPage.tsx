import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useContent, useJsonContent } from "@/lib/content-context";

const defaultValues = [
  { title: "Artigianale", body: "Ogni candela è modellata e rifinita a mano. Nessuna produzione di massa, nessuna scorciatoia." },
  { title: "Minimalista", body: "Il design geometrico del vaso cubico in cemento è pensato per integrarsi in qualsiasi ambiente senza sovrastarlo." },
  { title: "Sensoriale", body: "Le fragranze sono selezionate con cura per evocare atmosfere precise: il comfort di casa, un momento di calma." },
];

const defaultMaterials = [
  { name: "Cemento", desc: "Il vaso è realizzato in cemento naturale, con una texture leggermente porosa che racconta l'artigianalità di ogni pezzo. Il colore grigio è unico — nessun vaso è identico a un altro." },
  { name: "Cera", desc: "Usiamo cera di alta qualità, colorata a mano con pigmenti naturali. La cera è visibile dall'alto, creando un contrasto cromatico elegante con il grigio del cemento." },
  { name: "Fragranze", desc: "Le fragranze sono selezionate tra le migliori essenze disponibili. Ogni aroma è testato per garantire una diffusione intensa ma mai eccessiva." },
  { name: "Stoppino", desc: "Stoppini in cotone naturale, senza piombo. Progettati per una combustione pulita e uniforme, che rispetta sia il prodotto che l'ambiente." },
];

export default function AboutPage() {
  useScrollReveal();
  const c = useContent();
  const values = useJsonContent("about_values", defaultValues);
  const materials = useJsonContent("about_materials", defaultMaterials);

  useEffect(() => {
    document.title = `Chi siamo – ${c["brand_name"] || "LilosCandle"}`;
  }, [c]);

  return (
    <div className="bg-[#FAF8F5]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-[#2C2826]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#8B8680] mb-6">
            {c["about_eyebrow"] || "Chi siamo"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-8">
            {c["about_hero_title_1"] || "Una fiamma,"}
            <br />
            <span className="italic text-[#C5BEB8]">{c["about_hero_title_2"] || "un'idea."}</span>
          </h1>
          <p className="text-[#8B8680] text-xl max-w-xl mx-auto font-light leading-relaxed">
            {c["about_hero_subtitle"] || "LilosCandle nasce dall'incontro tra il design industriale e la tradizione artigianale."}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="reveal">
            <h2 className="font-serif text-4xl text-[#2C2826] leading-tight mb-8">
              {c["about_story_title"] || "La storia"}
            </h2>
            <p className="text-[#6B6560] leading-relaxed mb-6 font-light text-lg">
              {c["about_story_p1"] || "Tutto inizia con una passione per gli spazi domestici e il desiderio di creare oggetti che fossero al tempo stesso belli, funzionali e capaci di evocare emozioni."}
            </p>
            <p className="text-[#6B6560] leading-relaxed font-light">
              {c["about_story_p2"] || "Il cemento — materiale grezzo, onesto, contemporaneo — diventa il contenitore naturale per qualcosa di morbido e sensoriale: la cera profumata. Due opposti che si incontrano, creando un oggetto unico."}
            </p>
          </div>
          <div className="reveal reveal-delay-2">
            <div className="bg-[#F0EBE3] aspect-square flex items-center justify-center">
              <svg width="160" height="180" viewBox="0 0 160 180" fill="none">
                <rect width="160" height="180" rx="3" fill="url(#aboutCement)" />
                <rect x="13" y="13" width="134" height="58" rx="2" fill="#7C6B8A" fillOpacity="0.88" />
                <defs>
                  <linearGradient id="aboutCement" x1="0" y1="0" x2="160" y2="180" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#C5BEB8" />
                    <stop offset="40%" stopColor="#D8D2CB" />
                    <stop offset="70%" stopColor="#BDB6AE" />
                    <stop offset="100%" stopColor="#A89E96" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-28 px-6 bg-[#F0EBE3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">
              {c["about_values_eyebrow"] || "La nostra filosofia"}
            </p>
            <h2 className="font-serif text-4xl text-[#2C2826]">
              {c["about_values_title"] || "Fatto con intenzione."}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={v.title} className={`reveal reveal-delay-${i + 1}`}>
                <h3 className="font-serif text-2xl text-[#2C2826] mb-4">{v.title}</h3>
                <p className="text-[#6B6560] font-light leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">
              {c["about_materials_eyebrow"] || "I materiali"}
            </p>
            <h2 className="font-serif text-4xl text-[#2C2826]">
              {c["about_materials_title"] || "Solo il meglio."}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {materials.map((m, i) => (
              <div key={m.name} className={`reveal reveal-delay-${(i % 2) + 1} border-t border-[#E8E3DC] pt-8`}>
                <h3 className="font-serif text-xl text-[#2C2826] mb-3">{m.name}</h3>
                <p className="text-[#6B6560] font-light leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#2C2826] text-center">
        <div className="max-w-xl mx-auto reveal">
          <h2 className="font-serif text-3xl text-white mb-6">
            {c["about_cta_title"] || "Prova le nostre candele."}
          </h2>
          <Link href="/products">
            <button className="group border border-white/40 text-white px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-[#2C2826] transition-all duration-300 flex items-center gap-3 mx-auto">
              {c["about_cta_button"] || "Scopri lo shop"}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
