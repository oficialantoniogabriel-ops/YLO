// netlify/functions/create-order.js
const fetch = require('node-fetch');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' };
    }

    const body = JSON.parse(event.body);
    const { product_id, quantity = 1, buyer_id, success_url, cancel_url } = body;

    if (!product_id || !buyer_id) {
      return { statusCode: 400, body: 'Missing product_id or buyer_id' };
    }

    // Fetch product from Supabase
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

    const amount = Math.round(parseFloat(product.preco) * 100 * quantity);

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
      metadata: { product_id, buyer_id }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
