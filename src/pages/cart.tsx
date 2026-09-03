import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowLeft, Trash2, ShoppingCart, ArrowRight, Shield, Camera, Clock } from 'lucide-react';
import { useCart } from '@/contexts/use-cart';
import { cart as cartContent } from 'virtual:content';

const TRUST_ICONS: Record<string, React.ReactNode> = {
  shield: <Shield size={14} />,
  camera: <Camera size={14} />,
  clock: <Clock size={14} />,
};

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  // Demo mode: bypass Stripe, navigate directly to success
  function handleCheckout() {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setTimeout(() => {
      navigate('/checkout/success?session_id=demo_session_blokpakt');
    }, 900);
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <>
      <Helmet>
        <title>Your Cart — Blokpakt</title>
        <meta name="description" content="Review your Blokpakt service booking before checkout." />
        <link rel="canonical" href="https://blokpakt.com/cart" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={15} />
            <span>{cartContent.backLink}</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-foreground mb-1">{cartContent.pageTitle}</h1>
          <p className="text-muted-foreground text-sm mb-8">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </p>

          {/* Demo banner */}
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
            <span>{cartContent.demoBanner}</span>
          </div>

          {cart.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <ShoppingCart size={48} className="text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">{cartContent.emptyTitle}</h2>
              <p className="text-muted-foreground text-sm mb-6">{cartContent.emptySubtitle}</p>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
              >
                <span>{cartContent.emptyCtaLabel}</span> <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden mb-5">
                {cart.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-5 ${index > 0 ? 'border-t border-border' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                      🌿
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground font-bold transition-colors"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-foreground font-bold transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-foreground min-w-[72px] text-right">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-base font-bold text-foreground mb-4">{cartContent.orderSummaryTitle}</h2>
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{cartContent.subtotalLabel} ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{cartContent.platformFeeLabel}</span>
                    <span>{formatPrice(Math.round(cartTotal * 0.05))}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                    <span>{cartContent.totalLabel}</span>
                    <span>{formatPrice(Math.round(cartTotal * 1.05))}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {checkingOut ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                      <span>{cartContent.processingLabel}</span>
                    </>
                  ) : (
                    <>
                      <span>{cartContent.checkoutCtaLabel}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <button
                  onClick={clearCart}
                  className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  {cartContent.clearCartLabel}
                </button>
              </div>

              {/* Trust strip */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cartContent.trustItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5 rounded-xl bg-card border border-border px-4 py-3">
                    <span className="text-primary mt-0.5 flex-shrink-0">{TRUST_ICONS[item.icon]}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
