here// netlify/functions/create-order.js
const fetch = require('node-fetch')
const stripe = require('stripe')(process.env.STRIPE_SECRET)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const body = JSON.parse(event.body)
  const { product_id, quantity = 1, buyer_id, success_url, cancel_url } = body
  if (!product_id || !buyer_id) return { statusCode: 400, body: 'missing' }

  // fetch product details from Supabase (public read)
  const prodRes = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/produtos?id=eq.${product_id}`, {
    headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
  })
  const prod = (await prodRes.json())[0]
  if (!prod) return { statusCode: 404, body: 'product not found' }

  const amount = Math.round(parseFloat(prod.preco) * 100 * (quantity || 1)) // cents

  // create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'usd', product_data: { name: prod.nome }, unit_amount: amount }, quantity }],
    mode: 'payment',
    success_url: success_url || 'https://your-site/success',
    cancel_url: cancel_url || 'https://your-site/cancel',
    metadata: { product_id, buyer_id }
  })

  // create order record in DB via service role
  const orderRes = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/pedidos`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      comprador_id: buyer_id,
      vendedor_id: prod.vendedor_id,
      produto_id: product_id,
      quantidade,
      total: amount / 100,
      estado: 'pendente'
    })
  })
  const orderData = await orderRes.json()

  return { statusCode: 200, body: JSON.stringify({ checkoutUrl: session.url, order: orderData[0] }) }
  }
