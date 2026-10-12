import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useContent, useJsonContent } from "@/lib/content-context";
import { RandomImage } from "@/components/RandomImage";

const defaultSteps = [
  { number: "01", title: "Il vaso in cemento", subtitle: "La forma", body: "Ogni vaso viene creato versando il cemento in uno stampo cubico fatto su misura. Una volta solidificato, il pezzo viene estratto dallo stampo e levigato a mano. La superficie mantiene una texture naturale e leggermente porosa — ogni vaso è unico.", detail: "Cemento naturale · Cura artigianale · Texture unica" },
  { number: "02", title: "La preparazione della cera", subtitle: "Il cuore", body: "La cera viene fusa a temperatura controllata e mescolata con i pigmenti naturali che le danno il colore caratteristico. Il processo di colorazione è fatto a mano, un piccolo gesto che conferisce a ogni candela una tonalità leggermente diversa.", detail: "Cera di qualità · Pigmenti naturali · Processo artigianale" },
  { number: "03", title: "La profumazione", subtitle: "L'anima", body: "Prima di versare la cera nel vaso, viene aggiunta la fragranza selezionata. La concentrazione è calibrata con cura per garantire una diffusione intensa ma equilibrata — presente senza essere opprimente.", detail: "Fragranze selezionate · Concentrazione calibrata · Diffusione duratura" },
  { number: "04", title: "Il colaggio", subtitle: "L'unione", body: "La cera fusa, colorata e profumata viene versata nel vaso di cemento. Lo stoppino in cotone naturale viene posizionato al centro con precisione. Poi si attende: la cera si consolida lentamente, trovando la sua forma definitiva.", detail: "Stoppino in cotone · Colaggio preciso · Solidificazione naturale" },
  { number: "05", title: "La rifinitura", subtitle: "Il dettaglio", body: "Ogni candela viene ispezionata singolarmente. La superficie della cera viene livellata se necessario, lo stoppino viene tagliato alla lunghezza corretta. Solo le candele che superano il controllo qualità escono dal laboratorio.", detail: "Controllo qualità · Rifinitura manuale · Pronta per te" },
];

export default function HowMadePage() {
  useScrollReveal();
  const c = useContent();
  const steps = useJsonContent("howmade_steps", defaultSteps);

  useEffect(() => {
    document.title = `Come sono fatte – ${c["brand_name"] || "LilosCandle"}`;
  }, [c]);

  return (
    <div className="bg-[#FAF8F5]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-[#F0EBE3]">
        <div className="max-w-4xl mx-auto text-center reveal">
          <p className="text-xs uppercase tracking-[0.4em] text-[#8B8680] mb-6">
            {c["howmade_eyebrow"] || "Il processo"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-[#2C2826] leading-tight mb-8">
            {c["howmade_hero_title_1"] || "Come sono fatte"}
            <br />
            <span className="italic text-[#8B8680]">{c["howmade_hero_title_2"] || "le candele."}</span>
          </h1>
          <p className="text-[#8B8680] text-xl max-w-xl mx-auto font-light leading-relaxed">
            {c["howmade_hero_subtitle"] || "Dalla materia prima al prodotto finito — ogni passaggio è fatto a mano, con cura e attenzione ai dettagli."}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`reveal grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20 ${
                i !== steps.length - 1 ? "border-b border-[#E8E3DC]" : ""
              }`}
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="font-serif text-6xl text-[#E8E3DC]">{step.number}</span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-1">{step.subtitle}</p>
                    <h2 className="font-serif text-3xl text-[#2C2826]">{step.title}</h2>
                  </div>
                </div>
                <p className="text-[#6B6560] leading-relaxed font-light text-lg mb-6">{step.body}</p>
                <p className="text-xs text-[#8B8680] uppercase tracking-[0.2em]">{step.detail}</p>
              </div>
              <div className={`${i % 2 === 1 ? "md:order-1" : ""} relative bg-[#F0EBE3] aspect-square rounded-2xl overflow-hidden`}>
                <RandomImage alt={step.title} />
                <span className="absolute left-5 bottom-4 font-serif text-5xl text-white/80 drop-shadow">{step.number}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-[#FAF8F5]">
        <div className="max-w-xl mx-auto reveal">
          <h2 className="font-serif text-3xl text-[#2C2826] mb-6">
            {c["howmade_cta_title"] || "Pronta a portarla a casa?"}
          </h2>
          <Link href="/products">
            <button className="group bg-[#2C2826] text-white px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#3C3835] transition-all duration-300 flex items-center gap-3 mx-auto rounded-xl">
              {c["howmade_cta_button"] || "Acquista ora"}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
