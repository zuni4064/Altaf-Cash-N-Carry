import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "onboarding@resend.dev";
const TEST_EMAIL = "zony4064@gmail.com"; // only this address works until domain is verified

interface OrderRecord {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  total: number;
  delivery_charge: number;
  payment_method: string;
  address: string;
  created_at: string;
}

interface WebhookPayload {
  type: "UPDATE";
  table: string;
  record: OrderRecord;
  old_record: OrderRecord;
}

const STATUS_CONFIG: Record<string, {
  subject: string;
  emoji: string;
  headline: string;
  subtext: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}> = {
  confirmed: {
    subject:   "✅ Your order has been confirmed!",
    emoji:     "✅",
    headline:  "Order Confirmed!",
    subtext:   "Great news! Your order has been reviewed and confirmed. We're now preparing it for delivery.",
    color:     "#16a34a",
    badgeBg:   "#dcfce7",
    badgeText: "#15803d",
  },
  preparing: {
    subject:   "👨‍🍳 Your order is being prepared!",
    emoji:     "👨‍🍳",
    headline:  "Preparing Your Order!",
    subtext:   "Our team is carefully picking and packing your items. Your order will be out for delivery very soon!",
    color:     "#d97706",
    badgeBg:   "#fef3c7",
    badgeText: "#b45309",
  },
  "out-for-delivery": {
    subject:   "🚚 Your order is out for delivery!",
    emoji:     "🚚",
    headline:  "On Its Way!",
    subtext:   "Your order is out for delivery and will arrive shortly. Please ensure someone is available to receive it.",
    color:     "#2563eb",
    badgeBg:   "#dbeafe",
    badgeText: "#1d4ed8",
  },
  delivered: {
    subject:   "📦 Your order has been delivered!",
    emoji:     "📦",
    headline:  "Delivered Successfully!",
    subtext:   "Your order has been delivered. We hope you enjoy your purchase! Thank you for shopping with Altaf Cash & Carry.",
    color:     "#7c3aed",
    badgeBg:   "#ede9fe",
    badgeText: "#6d28d9",
  },
  cancelled: {
    subject:   "❌ Your order has been cancelled",
    emoji:     "❌",
    headline:  "Order Cancelled",
    subtext:   "Unfortunately, your order has been cancelled. If you have any questions, please contact us on WhatsApp.",
    color:     "#dc2626",
    badgeBg:   "#fee2e2",
    badgeText: "#b91c1c",
  },
};

/* ── Email HTML builder ────────────────────────────────────── */
function buildEmailHtml(order: OrderRecord, cfg: typeof STATUS_CONFIG[string]): string {
  const shortId  = order.id.toString().slice(-10).toUpperCase();
  const dateStr  = new Date(order.created_at).toLocaleDateString("en-PK", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const isFree   = order.delivery_charge === 0 && order.total >= 2000;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cfg.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#16305a 100%);padding:32px 32px 28px;text-align:center;">
            <p style="margin:0 0 6px;color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Altaf Cash &amp; Carry</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">${cfg.emoji} ${cfg.headline}</h1>
            <p style="margin:10px 0 0;color:#bfdbfe;font-size:13px;">Order #${shortId}</p>
          </td>
        </tr>

        <!-- Status badge -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <span style="display:inline-block;background:${cfg.badgeBg};color:${cfg.badgeText};font-size:13px;font-weight:700;padding:8px 22px;border-radius:50px;border:1.5px solid ${cfg.color}30;">
              ${cfg.emoji} ${order.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              Hi <strong>${order.customer_name}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
              ${cfg.subtext}
            </p>

            <!-- Order details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Order Details</p>
              </td></tr>
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding-bottom:10px;">Order ID</td>
                    <td style="text-align:right;font-weight:700;font-size:13px;color:#111827;padding-bottom:10px;">#${shortId}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding-bottom:10px;">Order Date</td>
                    <td style="text-align:right;font-size:13px;color:#374151;padding-bottom:10px;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding-bottom:10px;">Payment</td>
                    <td style="text-align:right;font-size:13px;color:#374151;padding-bottom:10px;">${order.payment_method}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;padding-bottom:10px;">Delivery</td>
                    <td style="text-align:right;font-size:13px;color:#374151;padding-bottom:10px;">
                      ${isFree ? '<span style="color:#16a34a;font-weight:700;">FREE ✨</span>' : `PKR ${order.delivery_charge.toLocaleString()}`}
                    </td>
                  </tr>
                  <tr style="border-top:1px solid #e2e8f0;">
                    <td style="color:#111827;font-size:14px;font-weight:700;padding-top:10px;">Total</td>
                    <td style="text-align:right;font-size:15px;font-weight:800;color:#1e3a5f;padding-top:10px;">PKR ${Math.round(order.total).toLocaleString()}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Address -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:14px 18px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#3b82f6;">📍 Delivery Address</p>
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${order.address}</p>
              </td></tr>
            </table>

            <!-- CTA / help -->
            <p style="margin:0 0 6px;text-align:center;color:#6b7280;font-size:13px;">Need help with your order?</p>
            <p style="margin:0;text-align:center;">
              <a href="https://wa.me/923062004403?text=Hi%2C%20my%20order%20is%20%23${shortId}"
                 style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 24px;border-radius:50px;">
                💬 Chat on WhatsApp
              </a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Altaf Cash &amp; Carry, Lahore</p>
            <p style="margin:0;color:#d1d5db;font-size:11px;">This email was sent because you placed an order with us.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Handler ───────────────────────────────────────────────── */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload: WebhookPayload = await req.json();

    // Only handle UPDATE events on the orders table
    if (payload.type !== "UPDATE" || payload.table !== "orders") {
      return new Response("Ignored", { status: 200 });
    }

    const { record, old_record } = payload;

    // Only fire when status actually changed
    if (record.status === old_record.status) {
      return new Response("Status unchanged", { status: 200 });
    }

    // Only send emails for these statuses
    const cfg = STATUS_CONFIG[record.status];
    if (!cfg) {
      console.log(`No email config for status: ${record.status}`);
      return new Response("No email for this status", { status: 200 });
    }

    if (!record.customer_email) {
      console.error("No customer email on order:", record.id);
      return new Response("No customer email", { status: 200 });
    }

    const html = buildEmailHtml(record, cfg);

    // ⚠️ TESTING MODE: Resend only allows sending to your own email until a
    // domain is verified. Replace TEST_EMAIL with your verified domain sender
    // and remove this override once domain is set up at resend.com/domains.
    const toEmail = TEST_EMAIL;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [toEmail],
        subject: cfg.subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response("Email failed", { status: 500 });
    }

    console.log(`✅ Status email sent → ${toEmail} (customer: ${record.customer_email}) [${record.status}]`);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response("Internal error", { status: 500 });
  }
});