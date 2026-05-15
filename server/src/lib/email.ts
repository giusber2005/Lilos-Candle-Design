import nodemailer from "nodemailer";
import { db } from "../db/index.js";
import { adminSettingsTable } from "../db/schema/index.js";
import { eq, inArray } from "drizzle-orm";

const SMTP_KEYS = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"] as const;

async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.select().from(adminSettingsTable).where(inArray(adminSettingsTable.key, keys));
  const out: Record<string, string> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

async function createTransport() {
  const cfg = await getSettings([...SMTP_KEYS]);
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) return null;
  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port: parseInt(cfg.smtp_port || "587"),
    secure: cfg.smtp_secure === "true",
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
  });
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  shippingAmount: number;
  shippingMethod: string;
  paymentMethod: string;
  shippingAddress: any;
  items: Array<{ productName: string; variantColor: string; variantAroma: string; quantity: number; unitPrice: number }>;
}): Promise<void> {
  const transport = await createTransport();
  if (!transport) return;

  const cfg = await getSettings(["smtp_from", "email_order_subject", "email_order_body"]);

  const address = typeof order.shippingAddress === "string"
    ? JSON.parse(order.shippingAddress)
    : order.shippingAddress;

  const itemsHtml = order.items
    .map((i) => `<tr>
      <td style="padding:8px 4px;border-bottom:1px solid #E8E3DC">${i.productName} (${i.variantColor}, ${i.variantAroma})</td>
      <td style="padding:8px 4px;border-bottom:1px solid #E8E3DC;text-align:center">${i.quantity}</td>
      <td style="padding:8px 4px;border-bottom:1px solid #E8E3DC;text-align:right">€${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>`)
    .join("");

  const defaultSubject = "Conferma ordine {{orderNumber}} — Lilo's Candle Design";
  const defaultBody = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2826">
  <h1 style="font-size:24px;margin-bottom:8px">Grazie per il tuo ordine!</h1>
  <p style="color:#8B8680">Ordine <strong>{{orderNumber}}</strong></p>
  <p>Ciao {{customerName}},<br>abbiamo ricevuto il tuo ordine e lo stiamo preparando con cura.</p>
  <h2 style="font-size:16px;margin-top:24px;border-bottom:1px solid #E8E3DC;padding-bottom:8px">Riepilogo ordine</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="color:#8B8680"><th style="text-align:left;padding:4px">Prodotto</th><th style="text-align:center;padding:4px">Qtà</th><th style="text-align:right;padding:4px">Prezzo</th></tr></thead>
    <tbody>{{itemsHtml}}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding:8px 4px;text-align:right;color:#8B8680">Spedizione ({{shippingMethod}})</td><td style="padding:8px 4px;text-align:right">€{{shippingAmount}}</td></tr>
      <tr><td colspan="2" style="padding:8px 4px;text-align:right;font-weight:bold">Totale</td><td style="padding:8px 4px;text-align:right;font-weight:bold">€{{totalAmount}}</td></tr>
    </tfoot>
  </table>
  <h2 style="font-size:16px;margin-top:24px;border-bottom:1px solid #E8E3DC;padding-bottom:8px">Indirizzo di spedizione</h2>
  <p style="font-size:14px">{{shippingAddress}}</p>
  <p style="margin-top:32px;color:#8B8680;font-size:13px">Lilo's Candle Design — candele artigianali</p>
</div>`;

  const vars: Record<string, string> = {
    orderNumber: order.orderNumber,
    customerName: `${address.firstName ?? ""} ${address.lastName ?? ""}`.trim(),
    totalAmount: Number(order.totalAmount).toFixed(2),
    shippingAmount: Number(order.shippingAmount).toFixed(2),
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    itemsHtml,
    shippingAddress: `${address.address ?? ""}, ${address.city ?? ""} ${address.postalCode ?? ""}, ${address.country ?? ""}`,
  };

  const subject = renderTemplate(cfg.email_order_subject || defaultSubject, vars);
  const html = renderTemplate(cfg.email_order_body || defaultBody, vars);

  await transport.sendMail({
    from: cfg.smtp_from || cfg.smtp_user,
    to: order.customerEmail,
    subject,
    html,
  });
}

export async function sendNewsletterEmail(params: {
  subscribers: Array<{ email: string; firstName?: string | null }>;
  subject: string;
  body: string;
}): Promise<{ sent: number; failed: number }> {
  const transport = await createTransport();
  if (!transport) throw new Error("SMTP non configurato");

  const cfg = await getSettings(["smtp_from", "smtp_user"]);
  const from = cfg.smtp_from || cfg.smtp_user;

  let sent = 0;
  let failed = 0;

  for (const sub of params.subscribers) {
    try {
      const vars: Record<string, string> = {
        firstName: sub.firstName || "",
        email: sub.email,
      };
      await transport.sendMail({
        from,
        to: sub.email,
        subject: renderTemplate(params.subject, vars),
        html: renderTemplate(params.body, vars),
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}

export async function testSmtpConnection(cfg: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): Promise<void> {
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transport.verify();
}
