import Stripe from "stripe";
import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false, // ❗ Obrigatório para o Stripe validar o webhook
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let event;
  const buf = await buffer(req);
  const signature = req.headers["stripe-signature"];

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Erro ao validar webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 🔥 EVENTOS QUE VOCÊ PODE USAR
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      console.log("💰 PAGAMENTO FINALIZADO!");
      console.log("Usuário:", session.customer_email);
      console.log("Valor:", session.amount_total / 100);

      // 👉 Aqui você ativa o produto, curso, assinatura, etc.
      break;

    case "payment_intent.succeeded":
      console.log("✅ Pagamento aprovado!");
      break;

    case "customer.subscription.created":
      console.log("🔔 Nova assinatura criada");
      break;

    default:
      console.log("📌 Evento recebido:", event.type);
  }

  res.json({ received: true });
  }
