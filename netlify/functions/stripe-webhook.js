// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const fetch = require('node-fetch')

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature']
  let evt
  try {
    evt = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return { statusCode: 400, body: `Webhook error: ${err.message}` }
  }

  if (evt.type === 'checkout.session.completed') {
    const session = evt.data.object
    const metadata = session.metadata || {}
    const product_id = metadata.product_id
    const buyer_id = metadata.buyer_id

    // update relevant pedido created earlier (find latest pending)
    // for simplicity: create pagamento record and mark pedido as 'pago'
    // In production, map session.id -> order

    // create pagamento
    await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/pagamentos`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pedido_id: null,
        metodo: 'card',
        estado: 'confirmado',
        referencia: session.id,
        valor: (session.amount_total || 0) / 100
      })
    })

    // you should find and update the associated pedido (omitted for brevity)
  }

  return { statusCode: 200, body: 'ok' }
  }
