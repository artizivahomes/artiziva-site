"use client";

import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/utils";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function CartSidebar() {
  const { items, removeItem, updateQuantity, totalItems, subtotal, isOpen, setIsOpen, clearCart } =
    useCart();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");

  // Calculate booking advance: 50% of the item price capped at Rs. 51,000 per item
  const bookingDeposit = items.reduce((sum, item) => {
    const price = item.product.price || 0;
    const depositPerItem = Math.min(price * 0.5, 51000);
    return sum + (depositPerItem * item.quantity);
  }, 0);
  // Cap the final payment amount at Rs. 2,00,000 for UPI/Razorpay transaction limits
  const finalPaymentAmount = Math.min(bookingDeposit, 200000);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    const formattedItems = items.map((item) => ({
      product: {
        id: item.product.id,
        price: item.product.price,
        title: item.product.title,
        images: item.product.images,
      },
      quantity: item.quantity,
    }));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPaymentAmount,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          customer_address: address,
          customer_city: city,
          customer_pin: pin,
          items: formattedItems,
          subtotal,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initiate checkout");
      }

      const orderData = await res.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Artiziva Homes",
        description: "Bespoke Masterpiece Purchase",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Call confirmation endpoint to mark order as paid
            const confirmRes = await fetch("/api/checkout/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                supabaseOrderId: orderData.supabaseOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
              }),
            });
            if (confirmRes.ok) {
              alert(`Payment successful! Booking order placed. Payment ID: ${response.razorpay_payment_id}`);
              clearCart();
              setStep("cart");
              setIsOpen(false);
            } else {
              alert("Payment succeeded, but failed to confirm order in database. Please contact support.");
            }
          } catch (confirmErr) {
            console.error("Order confirmation failed:", confirmErr);
            alert("Payment succeeded, but failed to confirm order in database. Please contact support.");
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#c5a880",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay checkout error:", err);
      alert(err.message || "Payment initiation failed. Please check credentials or try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const inputClass = "w-full bg-bg-hover border border-border px-3 py-2 text-cream text-xs focus:border-gold outline-none";
  const labelClass = "block text-[10px] uppercase tracking-wider text-text-secondary mb-1";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-secondary border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gold" />
                <h2 className="font-serif text-xl text-cream">
                  {step === "cart" ? `Your Cart (${totalItems})` : "Shipping Details"}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-bg-hover rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {step === "cart" ? (
                items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="w-16 h-16 text-text-muted mb-4" />
                    <p className="text-text-secondary text-lg font-serif mb-2">
                      Your cart is empty
                    </p>
                    <p className="text-text-muted text-sm mb-6">
                      Discover our handcrafted masterpieces
                    </p>
                    <Link
                      href="/shop"
                      onClick={() => setIsOpen(false)}
                      className="btn-luxury btn-outline text-xs"
                    >
                      Explore Collection
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-4 bg-bg-card p-4 border border-border"
                    >
                      <div className="relative w-24 h-24 shrink-0 overflow-hidden">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-sm text-cream truncate">
                          {item.product.title}
                        </h3>
                        <p className="text-gold text-sm mt-1">
                          {item.product.price
                            ? formatPrice(item.product.price)
                            : "Price on Request"}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1 border border-border hover:border-gold transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-1 border border-border hover:border-gold transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="ml-auto p-1 text-text-muted hover:text-error transition-colors"
                            aria-label="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )
              ) : (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <div className="flex">
                      <span className="bg-bg-hover border border-border border-r-0 px-3 flex items-center text-text-muted text-xs">+91</span>
                      <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} border-l-0`} placeholder="9876543210" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Shipping Address *</label>
                    <textarea required value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} h-16 resize-none`} placeholder="House/Apartment number, Street details" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>City *</label>
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Siliguri" />
                    </div>
                    <div>
                      <label className={labelClass}>PIN Code *</label>
                      <input type="text" required value={pin} onChange={(e) => setPin(e.target.value)} className={inputClass} placeholder="734001" />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-6 space-y-4 bg-bg-secondary">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary uppercase text-xs tracking-widest">
                    Items Subtotal
                  </span>
                  <span className="text-text-secondary">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t border-dashed border-border pt-3">
                  <div className="flex flex-col">
                    <span className="text-gold uppercase text-xs tracking-widest font-semibold">
                      Booking Advance
                    </span>
                    <span className="text-[10px] text-text-muted">
                      50% value (max ₹51,000 / item)
                    </span>
                  </div>
                  <span className="text-xl font-serif gold-text">
                    {formatPrice(finalPaymentAmount)}
                  </span>
                </div>

                <div className="bg-gold/5 border border-gold/20 p-3 text-[10px] text-text-secondary leading-normal space-y-1">
                  <p className="font-semibold text-gold uppercase tracking-wider">Payment Policy</p>
                  <p>We collect a 50% booking advance (capped at ₹51,000 per item) to initiate the custom handcrafting of your masterpiece. The remaining balance is payable upon completion and prior to delivery. Total checkout is capped at ₹2,00,000.</p>
                </div>

                {step === "cart" ? (
                  <button
                    onClick={() => setStep("checkout")}
                    className="btn-luxury btn-gold w-full group flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="border border-border text-text-secondary hover:text-cream text-xs px-4 py-2"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={isCheckingOut}
                      className="btn-luxury btn-gold flex-1 group flex items-center justify-center gap-2"
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay Booking Advance
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {step === "cart" && (
                  <Link
                    href="/contact"
                    onClick={() => setIsOpen(false)}
                    className="btn-luxury btn-outline w-full text-xs text-center block"
                  >
                    Request Custom Quote
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

