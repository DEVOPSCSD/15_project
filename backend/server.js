
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const API = "https://dummyjson.com/products";

// Middleware
app.use(cors());
app.use(express.json());

// Convert external products to the format used by DevShop
function formatProduct(p) {
  return {
    _id: String(p.id),
    name: p.title,
    category: p.category,
    price: p.price,
    image: p.thumbnail || p.images?.[0] || "",
    description: p.description || "",
    stock: p.stock ?? 0,
    rating: p.rating ?? 0,
    brand: p.brand || "Generic",
    discountPercentage: p.discountPercentage ?? 0,
  };
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "DevShop API is running without MongoDB",
    status: "OK",
  });
});

// Get products, search products, and filter by category
app.get("/api/products", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) &&
      requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 100)
      : 0;

    let url;

    if (q) {
      url = new URL(`${API}/search`);
      url.searchParams.set("q", q);
    } else if (category && category.toLowerCase() !== "all") {
      url = new URL(
        `${API}/category/${encodeURIComponent(category)}`
      );
    } else {
      url = new URL(API);
    }

    // DummyJSON supports limit=0 to return the complete catalog.
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("skip", String(skip));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Product provider returned ${response.status}`
      );
    }

    const data = await response.json();

    res.json({
      products: (data.products || []).map(formatProduct),
      total: data.total || 0,
      skip: data.skip || 0,
      limit: data.limit || 0,
    });
  } catch (error) {
    console.error("Product catalog error:", error.message);

    res.status(502).json({
      message:
        "Could not load products. Check your internet connection.",
    });
  }
});

// Dynamic categories
app.get("/api/categories", async (req, res) => {
  try {
    const response = await fetch(`${API}/category-list`);

    if (!response.ok) {
      throw new Error(
        `Category provider returned ${response.status}`
      );
    }

    res.json(await response.json());
  } catch (error) {
    console.error("Category error:", error.message);

    res.status(502).json({
      message: "Could not load product categories.",
    });
  }
});

// Single product details
app.get("/api/products/:id", async (req, res) => {
  try {
    const response = await fetch(
      `${API}/${encodeURIComponent(req.params.id)}`
    );

    if (response.status === 404) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    if (!response.ok) {
      throw new Error("Product provider request failed");
    }

    const product = await response.json();
    res.json(formatProduct(product));
  } catch (error) {
    console.error("Product details error:", error.message);

    res.status(502).json({
      message: "Could not load product details.",
    });
  }
});

// Demo order storage.
// Orders remain available until the backend process restarts.
const orders = [];

// Place a demo order
app.post("/api/orders", (req, res) => {
  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your shopping bag is empty.",
      });
    }

    // Validate every order item
    const validatedItems = items.map((item) => {
      const productId = String(item.productId || "");
      const name = String(item.name || "").trim();
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !productId ||
        !name ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        throw new Error("An order item contains invalid data.");
      }

      return {
        productId,
        name,
        price,
        quantity,
        subtotal: Math.round(price * quantity * 100) / 100,
      };
    });

    const total = Math.round(
      validatedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      ) * 100
    ) / 100;

    const orderReference = `DS-${Date.now()}`;

    const order = {
      id: orderReference,
      items: validatedItems,
      total,
      status: "Placed",
      createdAt: new Date().toISOString(),
    };

    orders.push(order);

    console.log(
      `Demo order ${orderReference} placed. Total: ₹${total}`
    );

    return res.status(201).json({
      message: "Demo order placed successfully!",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Could not place your order.",
    });
  }
});

// View demo order history
app.get("/api/orders", (req, res) => {
  res.json({
    totalOrders: orders.length,
    orders,
  });
});

// Handle unknown API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`DevShop API running on port ${PORT}`);
});
