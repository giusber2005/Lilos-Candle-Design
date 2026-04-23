/**
 * Seeds the site_content table with all editable site content.
 * Run with: pnpm --filter @workspace/db run seed-content
 * Safe to re-run — uses INSERT OR IGNORE (onConflictDoNothing).
 */
import { db } from "./index";
import { siteContentTable } from "./schema/index";

const defaultContent = [
  // ── Hero ─────────────────────────────────────────────────────────────────────
  { key: "hero_badge", value: "Artigianale · Italiana", type: "text", label: "Badge hero (piccola scritta sopra il titolo)", section: "hero" },
  { key: "hero_title_1", value: "Luce.", type: "text", label: "Titolo hero — riga 1", section: "hero" },
  { key: "hero_title_2", value: "Profumo.", type: "text", label: "Titolo hero — riga 2 (in corsivo)", section: "hero" },
  { key: "hero_title_3", value: "Artigianato.", type: "text", label: "Titolo hero — riga 3", section: "hero" },
  { key: "hero_subtitle", value: "Candele fatte a mano in vaso di cemento. Un design geometrico e minimalista che porta luce e calore nei tuoi spazi.", type: "textarea", label: "Sottotitolo hero", section: "hero" },
  { key: "hero_cta_primary", value: "Scopri le candele", type: "text", label: "Pulsante hero principale", section: "hero" },
  { key: "hero_cta_secondary", value: "Shop Now", type: "text", label: "Pulsante hero secondario", section: "hero" },

  // ── Homepage — Collezione ─────────────────────────────────────────────────────
  { key: "collection_eyebrow", value: "Le nostre candele", type: "text", label: "Etichetta sopra titolo collezione", section: "homepage" },
  { key: "collection_title", value: "Collezione Corrente", type: "text", label: "Titolo sezione collezione", section: "homepage" },

  // ── Homepage — Brand story ────────────────────────────────────────────────────
  { key: "brand_story_eyebrow", value: "Chi siamo", type: "text", label: "Etichetta sopra brand story", section: "homepage" },
  { key: "brand_story_title", value: "Ogni candela racconta una storia.", type: "text", label: "Titolo brand story", section: "homepage" },
  { key: "brand_story_p1", value: "Nasce dall'amore per il design e il profumo. Ogni candela LilosCandle è modellata in un contenitore cubico di cemento fatto a mano, riempito con cera naturale e fragranze selezionate.", type: "textarea", label: "Brand story — primo paragrafo", section: "homepage" },
  { key: "brand_story_p2", value: "Il cemento — materiale grezzo e moderno — incontra la morbidezza della cera colorata per creare un oggetto unico, capace di trasformare qualsiasi ambiente.", type: "textarea", label: "Brand story — secondo paragrafo", section: "homepage" },
  { key: "brand_story_cta", value: "La nostra storia", type: "text", label: "Link brand story", section: "homepage" },

  // ── Homepage — Processo ───────────────────────────────────────────────────────
  { key: "process_eyebrow", value: "Il processo", type: "text", label: "Etichetta sopra sezione processo", section: "homepage" },
  { key: "process_title", value: "Fatte con cura, una alla volta.", type: "text", label: "Titolo sezione processo", section: "homepage" },
  { key: "process_steps", value: JSON.stringify([
    { n: "01", title: "Il vaso", desc: "Modellato in cemento puro, con texture naturale." },
    { n: "02", title: "La cera", desc: "Cera di alta qualità, colorata a mano." },
    { n: "03", title: "Il profumo", desc: "Fragranze selezionate, intense e durature." },
    { n: "04", title: "La cura", desc: "Ogni pezzo è rifinito singolarmente." },
  ]), type: "json", label: "Step del processo (array JSON)", section: "homepage" },

  // ── Homepage — Recensioni ─────────────────────────────────────────────────────
  { key: "reviews_eyebrow", value: "Recensioni", type: "text", label: "Etichetta sopra recensioni", section: "homepage" },
  { key: "reviews_title", value: "Cosa dicono di noi", type: "text", label: "Titolo sezione recensioni", section: "homepage" },
  { key: "reviews", value: JSON.stringify([
    { name: "Giulia M.", text: "Semplicemente bellissima. L'aroma di amarena è delicato e avvolgente. Il design in cemento è unico nel suo genere.", rating: 5 },
    { name: "Marco T.", text: "Ho regalato la Big Boy ad una amica — era entusiasta. La qualità è eccezionale, si vede che è fatta con cura.", rating: 5 },
    { name: "Sofia R.", text: "La Lil One è perfetta per la mia scrivania. Piccola ma intensa. Tornerò sicuramente ad acquistare.", rating: 5 },
  ]), type: "json", label: "Recensioni (array JSON: name, text, rating)", section: "homepage" },

  // ── Homepage — Newsletter ─────────────────────────────────────────────────────
  { key: "newsletter_eyebrow", value: "Newsletter", type: "text", label: "Etichetta newsletter", section: "newsletter" },
  { key: "newsletter_title", value: "Sii il primo a sapere.", type: "text", label: "Titolo newsletter", section: "newsletter" },
  { key: "newsletter_subtitle", value: "Nuovi aromi, nuove collezioni e offerte riservate agli iscritti.", type: "textarea", label: "Sottotitolo newsletter", section: "newsletter" },
  { key: "newsletter_button", value: "Iscriviti", type: "text", label: "Testo pulsante newsletter", section: "newsletter" },
  { key: "newsletter_success", value: "Grazie! Sei iscritto alla nostra newsletter.", type: "text", label: "Messaggio conferma iscrizione", section: "newsletter" },

  // ── About — Hero ──────────────────────────────────────────────────────────────
  { key: "about_eyebrow", value: "Chi siamo", type: "text", label: "Etichetta hero Chi siamo", section: "about" },
  { key: "about_hero_title_1", value: "Una fiamma,", type: "text", label: "Titolo Chi siamo — riga 1", section: "about" },
  { key: "about_hero_title_2", value: "un'idea.", type: "text", label: "Titolo Chi siamo — riga 2 (in corsivo)", section: "about" },
  { key: "about_hero_subtitle", value: "LilosCandle nasce dall'incontro tra il design industriale e la tradizione artigianale.", type: "textarea", label: "Sottotitolo hero Chi siamo", section: "about" },

  // ── About — Storia ────────────────────────────────────────────────────────────
  { key: "about_story_title", value: "La storia", type: "text", label: "Titolo sezione storia", section: "about" },
  { key: "about_story_p1", value: "Tutto inizia con una passione per gli spazi domestici e il desiderio di creare oggetti che fossero al tempo stesso belli, funzionali e capaci di evocare emozioni.", type: "textarea", label: "Storia — primo paragrafo", section: "about" },
  { key: "about_story_p2", value: "Il cemento — materiale grezzo, onesto, contemporaneo — diventa il contenitore naturale per qualcosa di morbido e sensoriale: la cera profumata. Due opposti che si incontrano, creando un oggetto unico.", type: "textarea", label: "Storia — secondo paragrafo", section: "about" },

  // ── About — Valori ────────────────────────────────────────────────────────────
  { key: "about_values_eyebrow", value: "La nostra filosofia", type: "text", label: "Etichetta sezione valori", section: "about" },
  { key: "about_values_title", value: "Fatto con intenzione.", type: "text", label: "Titolo sezione valori", section: "about" },
  { key: "about_values", value: JSON.stringify([
    { title: "Artigianale", body: "Ogni candela è modellata e rifinita a mano. Nessuna produzione di massa, nessuna scorciatoia." },
    { title: "Minimalista", body: "Il design geometrico del vaso cubico in cemento è pensato per integrarsi in qualsiasi ambiente senza sovrastarlo." },
    { title: "Sensoriale", body: "Le fragranze sono selezionate con cura per evocare atmosfere precise: il comfort di casa, un momento di calma." },
  ]), type: "json", label: "Valori (array JSON: title, body)", section: "about" },

  // ── About — Materiali ─────────────────────────────────────────────────────────
  { key: "about_materials_eyebrow", value: "I materiali", type: "text", label: "Etichetta sezione materiali", section: "about" },
  { key: "about_materials_title", value: "Solo il meglio.", type: "text", label: "Titolo sezione materiali", section: "about" },
  { key: "about_materials", value: JSON.stringify([
    { name: "Cemento", desc: "Il vaso è realizzato in cemento naturale, con una texture leggermente porosa che racconta l'artigianalità di ogni pezzo. Il colore grigio è unico — nessun vaso è identico a un altro." },
    { name: "Cera", desc: "Usiamo cera di alta qualità, colorata a mano con pigmenti naturali. La cera è visibile dall'alto, creando un contrasto cromatico elegante con il grigio del cemento." },
    { name: "Fragranze", desc: "Le fragranze sono selezionate tra le migliori essenze disponibili. Ogni aroma è testato per garantire una diffusione intensa ma mai eccessiva." },
    { name: "Stoppino", desc: "Stoppini in cotone naturale, senza piombo. Progettati per una combustione pulita e uniforme, che rispetta sia il prodotto che l'ambiente." },
  ]), type: "json", label: "Materiali (array JSON: name, desc)", section: "about" },

  // ── About — CTA ───────────────────────────────────────────────────────────────
  { key: "about_cta_title", value: "Prova le nostre candele.", type: "text", label: "Titolo CTA Chi siamo", section: "about" },
  { key: "about_cta_button", value: "Scopri lo shop", type: "text", label: "Pulsante CTA Chi siamo", section: "about" },

  // ── HowMade — Hero ────────────────────────────────────────────────────────────
  { key: "howmade_eyebrow", value: "Il processo", type: "text", label: "Etichetta hero Come sono fatte", section: "howmade" },
  { key: "howmade_hero_title_1", value: "Come sono fatte", type: "text", label: "Titolo Come sono fatte — riga 1", section: "howmade" },
  { key: "howmade_hero_title_2", value: "le candele.", type: "text", label: "Titolo Come sono fatte — riga 2 (in corsivo)", section: "howmade" },
  { key: "howmade_hero_subtitle", value: "Dalla materia prima al prodotto finito — ogni passaggio è fatto a mano, con cura e attenzione ai dettagli.", type: "textarea", label: "Sottotitolo Come sono fatte", section: "howmade" },

  // ── HowMade — Step ────────────────────────────────────────────────────────────
  { key: "howmade_steps", value: JSON.stringify([
    { number: "01", title: "Il vaso in cemento", subtitle: "La forma", body: "Ogni vaso viene creato versando il cemento in uno stampo cubico fatto su misura. Una volta solidificato, il pezzo viene estratto dallo stampo e levigato a mano. La superficie mantiene una texture naturale e leggermente porosa — ogni vaso è unico.", detail: "Cemento naturale · Cura artigianale · Texture unica" },
    { number: "02", title: "La preparazione della cera", subtitle: "Il cuore", body: "La cera viene fusa a temperatura controllata e mescolata con i pigmenti naturali che le danno il colore caratteristico. Il processo di colorazione è fatto a mano, un piccolo gesto che conferisce a ogni candela una tonalità leggermente diversa.", detail: "Cera di qualità · Pigmenti naturali · Processo artigianale" },
    { number: "03", title: "La profumazione", subtitle: "L'anima", body: "Prima di versare la cera nel vaso, viene aggiunta la fragranza selezionata. La concentrazione è calibrata con cura per garantire una diffusione intensa ma equilibrata — presente senza essere opprimente.", detail: "Fragranze selezionate · Concentrazione calibrata · Diffusione duratura" },
    { number: "04", title: "Il colaggio", subtitle: "L'unione", body: "La cera fusa, colorata e profumata viene versata nel vaso di cemento. Lo stoppino in cotone naturale viene posizionato al centro con precisione. Poi si attende: la cera si consolida lentamente, trovando la sua forma definitiva.", detail: "Stoppino in cotone · Colaggio preciso · Solidificazione naturale" },
    { number: "05", title: "La rifinitura", subtitle: "Il dettaglio", body: "Ogni candela viene ispezionata singolarmente. La superficie della cera viene livellata se necessario, lo stoppino viene tagliato alla lunghezza corretta. Solo le candele che superano il controllo qualità escono dal laboratorio.", detail: "Controllo qualità · Rifinitura manuale · Pronta per te" },
  ]), type: "json", label: "Step processo (array JSON: number, title, subtitle, body, detail)", section: "howmade" },

  // ── HowMade — Consigli d'uso ──────────────────────────────────────────────────
  { key: "howmade_tips_eyebrow", value: "Consigli d'uso", type: "text", label: "Etichetta consigli d'uso", section: "howmade" },
  { key: "howmade_tips_title", value: "Prendi cura della tua candela.", type: "text", label: "Titolo consigli d'uso", section: "howmade" },
  { key: "howmade_tips", value: JSON.stringify([
    { tip: "Prima accensione", desc: "Lascia bruciare la candela almeno 2 ore alla prima accensione per permettere alla cera di formare uno strato uniforme." },
    { tip: "Lunghezza dello stoppino", desc: "Prima di ogni accensione, taglia lo stoppino a circa 5mm per garantire una combustione pulita e uniforme." },
    { tip: "Superficie del cemento", desc: "Il vaso in cemento è poroso. Evita di appoggiarlo su superfici delicate senza un sottovaso." },
    { tip: "Durata", desc: "Non lasciare la candela accesa per più di 4 ore consecutive. Spegnila e lasciala raffreddare prima di riaccenderla." },
  ]), type: "json", label: "Consigli d'uso (array JSON: tip, desc)", section: "howmade" },

  // ── HowMade — CTA ─────────────────────────────────────────────────────────────
  { key: "howmade_cta_title", value: "Pronta a portarla a casa?", type: "text", label: "Titolo CTA Come sono fatte", section: "howmade" },
  { key: "howmade_cta_button", value: "Acquista ora", type: "text", label: "Pulsante CTA Come sono fatte", section: "howmade" },

  // ── Brand / Identità ─────────────────────────────────────────────────────────
  { key: "brand_name", value: "LilosCandle", type: "text", label: "Nome del brand", section: "brand" },
  { key: "brand_tagline", value: "Luce. Profumo. Artigianato.", type: "text", label: "Tagline brand", section: "brand" },
  { key: "brand_description", value: "Candele artigianali in vaso di cemento, create con cura e passione.", type: "textarea", label: "Descrizione brand (footer)", section: "brand" },

  // ── Social ────────────────────────────────────────────────────────────────────
  { key: "instagram_url", value: "https://instagram.com/liloscandle", type: "link", label: "URL Instagram", section: "social" },
  { key: "instagram_handle", value: "@liloscandle", type: "text", label: "Handle Instagram", section: "social" },
  { key: "facebook_url", value: "", type: "link", label: "URL Facebook (lascia vuoto per nascondere)", section: "social" },
  { key: "tiktok_url", value: "", type: "link", label: "URL TikTok (lascia vuoto per nascondere)", section: "social" },

  // ── Shop ─────────────────────────────────────────────────────────────────────
  { key: "shop_eyebrow", value: "Collezione", type: "text", label: "Etichetta pagina shop", section: "shop" },
  { key: "shop_title", value: "Le nostre candele", type: "text", label: "Titolo pagina shop", section: "shop" },
  { key: "shop_subtitle", value: "Ogni candela è fatta a mano con ingredienti selezionati.", type: "textarea", label: "Sottotitolo pagina shop", section: "shop" },

  // ── Politiche di spedizione ───────────────────────────────────────────────────
  { key: "free_shipping_threshold", value: "50", type: "text", label: "Soglia spedizione gratuita (€)", section: "policies" },
  { key: "shipping_standard_price", value: "4.9", type: "text", label: "Prezzo spedizione standard (€)", section: "policies" },
  { key: "shipping_express_price", value: "9.9", type: "text", label: "Prezzo spedizione express (€)", section: "policies" },
  { key: "shipping_standard_days", value: "3–5 giorni lavorativi", type: "text", label: "Tempi spedizione standard", section: "policies" },
  { key: "shipping_express_days", value: "1–2 giorni lavorativi", type: "text", label: "Tempi spedizione express", section: "policies" },
];

async function seed() {
  console.log("Seeding site_content...");
  let inserted = 0;
  for (const row of defaultContent) {
    try {
      await db
        .insert(siteContentTable)
        .values({ ...row, updatedAt: new Date() })
        .onConflictDoNothing();
      inserted++;
    } catch {
      // skip duplicates
    }
  }
  console.log(`Done — processed ${defaultContent.length} rows (${inserted} inserted or skipped).`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
