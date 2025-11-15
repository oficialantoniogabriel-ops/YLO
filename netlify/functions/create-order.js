exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Dados enviados pelo front-end
    const { productId, productName, quantity, price } = body;

    if (!productId || !productName || !quantity || !price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Você pode futuramente enviar isso para um banco ou webhook
    const order = {
      id: "order_" + Date.now(),
      productId,
      productName,
      quantity,
      price,
      total: quantity * price,
      createdAt: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Order created successfully",
        order,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: error.message }),
    };
  }
};
