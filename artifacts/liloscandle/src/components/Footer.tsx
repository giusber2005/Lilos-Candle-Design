import { Link } from "wouter";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#2C2826] text-[#C5BEB8] py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-serif text-2xl text-white mb-3">LilosCandle</h3>
            <p className="text-sm leading-relaxed text-[#8B8680] font-light italic">
              Luce. Profumo. Artigianato.
            </p>
            <p className="text-sm leading-relaxed text-[#8B8680] mt-3 font-light">
              Candele artigianali in vaso di cemento, create con cura e passione.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-5">Esplora</h4>
            <div className="flex flex-col gap-3">
              {[
                { href: "/products", label: "Shop" },
                { href: "/about", label: "Chi siamo" },
                { href: "/how-made", label: "Come sono fatte" },
                { href: "/orders", label: "I miei ordini" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className="text-sm hover:text-white transition-colors cursor-pointer">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-5">Newsletter</h4>
            <p className="text-sm text-[#8B8680] mb-4">
              Ricevi novità su nuovi aromi e collezioni in anteprima.
            </p>
            <Link href="/#newsletter">
              <span className="inline-block text-sm border border-[#8B8680] px-4 py-2 rounded hover:border-white hover:text-white transition-colors cursor-pointer">
                Iscriviti
              </span>
            </Link>
            <div className="mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
              >
                <Instagram size={16} />
                @liloscandle
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#3C3835] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B6560]">
            © {new Date().getFullYear()} LilosCandle. Tutti i diritti riservati.
          </p>
          <p className="text-xs text-[#6B6560]">
            Fatto con ❤ artigianalmente
          </p>
        </div>
      </div>
    </footer>
  );
}
