
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  X,
} from "lucide-react";
import "./App.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Restore the shopping bag after refreshing the page.
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("devshop-cart") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Save cart changes in the browser.
  useEffect(() => {
    try {
      localStorage.setItem("devshop-cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [cart]);

  // Load products from the Express API.
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error(
            `Product API error: ${response.status}`
          );
        }

        const data = await response.json();
        const items = Array.isArray(data)
          ? data
          : data?.products;

        if (!Array.isArray(items)) {
          throw new Error(
            "The API did not return a products array."
          );
        }

        const normalized = items.map((p) => ({
          ...p,
          _id: String(p._id ?? p.id),
          name: p.name ?? p.title ?? "Unnamed product",
          description: p.description ?? "Everyday essential",
          category: p.category ?? "Other",
          price: Number(p.price ?? 0),
          image: p.image ?? p.thumbnail ?? p.images?.[0] ?? "",
          emoji: p.emoji ?? "✨",
          stock: Number(p.stock ?? 0),
          brand: p.brand ?? "Generic",
          rating: Number(p.rating ?? 0),
        }));

        if (!cancelled) {
          setProducts(normalized);
          setNotice("");
        }
      } catch (error) {
        console.error("Product loading error:", error);

        if (!cancelled) {
          setNotice(
            error.message || "Could not load products."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Build category filters from the catalog.
  const categories = useMemo(
    () => [
      "All",
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ],
    [products]
  );

  // Search by product name, description, brand, or category.
  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();

    return products.filter((p) => {
      const matchesCategory =
        category === "All" || p.category === category;

      const searchableText = [
        p.name,
        p.description,
        p.brand,
        p.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(term);
    });
  }, [products, category, query]);

  // Cart contents and totals.
  const cartItems = products
    .filter((p) => cart[p._id] > 0)
    .map((p) => ({
      ...p,
      quantity: cart[p._id],
    }));

  const count = cartItems.reduce(
    (sum, p) => sum + p.quantity,
    0
  );

  const total = cartItems.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  function changeQuantity(id, amount) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (Number(next[id]) || 0) + amount;

      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }

      return next;
    });
  }

  function removeFromCart(id) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  // Submit a demo order to POST /api/orders.
  async function checkout() {
    if (!cartItems.length) {
      setNotice("Your shopping bag is empty.");
      return;
    }

    if (checkoutLoading) return;

    try {
      setCheckoutLoading(true);
      setNotice("");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((p) => ({
            productId: p._id,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not place your demo order."
        );
      }

      const reference =
        data.order?.id ??
        data.order?.orderReference ??
        "Confirmed";

      // Clear and persist the empty cart, then show a visible confirmation.
      setCart({});
      setCartOpen(false);
      setNotice("");
      setOrderSuccess({
        message: data.message || "Your demo order has been placed successfully!",
        reference,
      });
    } catch (error) {
      console.error("Checkout error:", error);

      setNotice(
        error.message || "Checkout failed. Please try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="announcement">
        <Sparkles size={14} />
        YOUR NEXT FAVORITE THING IS RIGHT HERE
        <span>•</span> FREE SHIPPING OVER ₹2,000
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="DevShop home">
          <span className="brand-mark">D</span>
          devshop<span className="brand-dot">.</span>
        </a>

        <nav>
          <a href="#shop">Shop</a>
          <a href="#benefits">Why DevShop</a>
        </nav>

        <div className="header-actions">
          <label className="search-box">
            <Search size={17} />

            <input
              aria-label="Search products"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {query && (
              <button
                type="button"
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </label>

          <button
            type="button"
            className="cart-button"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
          >
            <ShoppingBag size={19} />
            <span>Bag</span>
            <b data-testid="cart-count">{count}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              THE EVERYDAY EDIT
            </div>

            <h1>
              Good things.
              <br />
              <em>Better living.</em>
            </h1>

            <p>
              Thoughtful essentials for your everyday.
              Discover smart design, useful details, and
              little upgrades that make a difference.
            </p>

            <a className="primary-button" href="#shop">
              Explore the collection
              <ArrowRight size={17} />
            </a>

            <div className="hero-proof">
              <div className="avatar-stack">
                <span>J</span>
                <span>A</span>
                <span>M</span>
              </div>
              <span>
                <strong>Discover something new</strong>
              </span>
            </div>
          </div>

          <div className="hero-art" aria-label="Featured products">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="hero-sun" />

            <div className="hero-card card-headphones">
              🎧
              <small>FOCUS MODE</small>
            </div>

            <div className="hero-card card-watch">
              ⌚
              <small>YOUR DAY, IN SYNC</small>
            </div>

            <div className="hero-card card-bag">
              🎒
              <small>READY TO GO</small>
            </div>

            <div className="art-label">
              <span>DEVSHOP</span>
              <span>CURATED FOR YOU ↗</span>
            </div>
          </div>
        </section>

        <section className="benefit-strip" id="benefits">
          <div>
            <Truck />
            <span>
              <strong>Easy shopping</strong>
              <small>Browse products in one place</small>
            </span>
          </div>

          <div>
            <ShieldCheck />
            <span>
              <strong>Quality first</strong>
              <small>Explore product details</small>
            </span>
          </div>

          <div>
            <Sparkles />
            <span>
              <strong>Little upgrades</strong>
              <small>Find everyday essentials</small>
            </span>
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE GOOD STUFF</div>
              <h2>
                Find your <em>everyday.</em>
              </h2>
            </div>

            <span className="results-count">
              {visibleProducts.length} products
            </span>
          </div>

          <div className="category-row" aria-label="Product categories">
            {categories.map((c) => (
              <button
                type="button"
                key={c}
                className={category === c ? "category active" : "category"}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading">
              Finding good things for you…
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((p, i) => (
                <article className="product-card" key={p._id}>
                  <div className={`product-visual visual-${i % 6}`}>
                    {p.image ? (
                      <img
                        className="product-image"
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="product-emoji">
                        {p.emoji}
                      </span>
                    )}

                    <span className="product-tag">
                      {p.category}
                    </span>

                    <button
                      type="button"
                      className="quick-add"
                      aria-label={`Add ${p.name} to cart`}
                      onClick={() => {
                        changeQuantity(p._id, 1);
                        setNotice(`${p.name} added to your bag`);
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="product-info">
                    <div>
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      <small className="product-brand">
                        {p.brand}
                      </small>
                    </div>

                    <strong>{money(p.price)}</strong>
                  </div>

                  <div className="product-meta">
                    <span>
                      ★ {p.rating ? p.rating.toFixed(1) : "New"}
                    </span>
                    <span>
                      {p.stock > 0
                        ? `${p.stock} in stock`
                        : "Stock unknown"}
                    </span>
                  </div>
                </article>
              ))}

              {!visibleProducts.length && (
                <div className="empty-results">
                  No products found. Try another search or category.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer>
        <a className="brand" href="#">
          <span className="brand-mark">D</span>
          devshop<span className="brand-dot">.</span>
        </a>
        <span>Good design for real life.</span>
        <span>© 2026 DevShop Demo</span>
      </footer>

      {cartOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            aria-label="Shopping cart"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">YOUR PICKS</span>
                <h2>
                  Your bag <span>({count})</span>
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close cart"
                onClick={() => setCartOpen(false)}
              >
                <X />
              </button>
            </div>

            {!cartItems.length ? (
              <div className="empty-cart">
                <div className="empty-bag">
                  <ShoppingBag size={30} />
                </div>

                <h3>Your bag is taking a break.</h3>
                <p>Add something good to get started.</p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setCartOpen(false)}
                >
                  Explore products
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {cartItems.map((p) => (
                    <div className="cart-item" key={p._id}>
                      <div className="cart-item-emoji">
                        {p.image ? (
                          <img src={p.image} alt={p.name} />
                        ) : (
                          p.emoji
                        )}
                      </div>

                      <div className="cart-item-info">
                        <strong>{p.name}</strong>
                        <span>{money(p.price)}</span>

                        <div className="quantity-control">
                          <button
                            type="button"
                            aria-label={`Decrease ${p.name} quantity`}
                            onClick={() => changeQuantity(p._id, -1)}
                          >
                            <Minus size={13} />
                          </button>

                          <span>{p.quantity}</span>

                          <button
                            type="button"
                            aria-label={`Increase ${p.name} quantity`}
                            onClick={() => changeQuantity(p._id, 1)}
                          >
                            <Plus size={13} />
                          </button>

                          <button
                            type="button"
                            className="remove-button"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => removeFromCart(p._id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <strong>
                        {money(p.price * p.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money(total)}</strong>
                  </div>

                  <small>
                    Demo checkout. No payment is collected.
                  </small>

                  <button
                    type="button"
                    className="checkout-button"
                    onClick={checkout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading
                      ? "Placing order..."
                      : "Place demo order"}

                    {!checkoutLoading && <ArrowRight size={17} />}
                  </button>

                  <p>
                    Demo checkout only — no payment is collected.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {orderSuccess && (
        <div
          className="order-success-backdrop"
          role="presentation"
          onClick={() => setOrderSuccess(null)}
        >
          <section
            className="order-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-success-icon" aria-hidden="true">
              ✓
            </div>
            <h2 id="order-success-title">Order Placed Successfully!</h2>
            <p>{orderSuccess.message}</p>
            <p className="order-reference">
              Order reference: <strong>{orderSuccess.reference}</strong>
            </p>
            <p className="order-demo-note">
              This is a demo order. No payment was collected.
            </p>
            <button
              type="button"
              className="primary-button order-success-button"
              onClick={() => setOrderSuccess(null)}
            >
              Continue Shopping <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
