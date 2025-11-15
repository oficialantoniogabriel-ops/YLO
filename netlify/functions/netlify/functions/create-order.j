// netlify/functions/create-order.js

const fetch = require('node-fetch');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // correto

exports.handler = async (event) => {
  try {
    // permitir apenas POST
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' };
    }

    // corpo recebido do front-end
    const body = JSON.parse(event.body);
    const { product_id, quantity = 1, buyer_id, success_url, cancel_url } = body;

    if (!product_id || !buyer_id) {
      return { statusCode: 400, body: 'Missing product_id or buyer_id' };
    }

    // buscar produto no Supabase
    const productRes = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/produtos?id=eq.${product_id}`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const product = (await productRes.json())[0];

    if (!product) {
      return { statusCode: 404, body: 'Product not found' };
    }

    // converter preço para centavos
    const amount = Math.round(parseFloat(product.preco) * 100 * quantity);

    // criar sesssão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: product.nome },
            unit_amount: amount,
          },
          quantity,
        }
      ],
      mode: 'payment',
      success_url: success_url || 'https://your-site/success',
      cancel_url: cancel_url || 'https://your-site/cancel',
      metadata: {
        product_id,
        buyer_id,
      }
    });

    // registrar pedido no Supabase
    const orderRes = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/pedidos`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          comprador_id: buyer_id,
          vendedor_id: product.vendedor_id,
          produto_id: product_id,
          quantidade: quantity,
          total: amount / 100,
          estado: 'pendente'
        })
      }
    );

    const order = await orderRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        checkoutUrl: session.url,
        order: order[0]
      })
    };

  } catch (e) {
    console.error('Error in create-order:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
