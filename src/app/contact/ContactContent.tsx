import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, MapPin, Phone, Mail, Upload, X } from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/ui/Icons";
import SectionHeading from "@/components/ui/SectionHeading";
import { PRODUCT_CATEGORIES, BUDGET_RANGES, INSTAGRAM_URL } from "@/lib/constants";

export default function ContactContent() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/category");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDbCategories(data.map((c: any) => c.name));
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      category: formData.get("category"),
      budget: formData.get("budget"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }
      
      setFormState("success");
      setFiles([]);
    } catch (err) {
      console.error("Submission error:", err);
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg">
          <CheckCircle className="w-16 h-16 text-gold mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-cream mb-4">Thank You!</h2>
          <p className="text-text-secondary text-lg mb-2">Your enquiry has been submitted successfully.</p>
          <p className="text-text-muted text-sm">Our team will contact you within 24 hours.</p>
        </motion.div>
      </section>
    );
  }

  const inputClass = "w-full bg-bg-card border border-border px-4 py-3.5 text-cream text-sm placeholder:text-text-muted focus:border-gold transition-colors duration-300";
  const labelClass = "block text-xs tracking-[0.15em] uppercase text-text-secondary mb-2";

  return (
    <>
      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute inset-0 resin-gradient opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-gold text-xs tracking-[0.3em] uppercase mb-4 block">Get in Touch</span>
            <h1 className="font-serif text-4xl md:text-6xl text-cream mb-4">Let&apos;s Create <span className="gold-text">Together</span></h1>
            <div className="w-16 h-0.5 gold-gradient mx-auto mb-6" />
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Tell us about your dream piece and we&apos;ll bring it to life.</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <div>
              <h3 className="font-serif text-xl text-cream mb-6">Contact Information</h3>
              <div className="space-y-5">
                {[
                  { icon: MapPin, label: "Visit Us", value: "Siliguri, West Bengal, India" },
                  { icon: Phone, label: "Call Us", value: "+91 96359 45687", href: "tel:+919635945687" },
                  { icon: Mail, label: "Email Us", value: "hello@artizivahomes.com", href: "mailto:hello@artizivahomes.com" },
                  { icon: Instagram, label: "Follow Us", value: "@artiziva.homes", href: INSTAGRAM_URL },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 group">
                    <div className="p-2.5 border border-border group-hover:border-gold transition-colors">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-text-muted text-xs tracking-wider uppercase mb-1">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-cream text-sm hover:text-gold transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-cream text-sm">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border border-border bg-bg-card">
              <h4 className="font-serif text-lg text-cream mb-2">Bespoke Process</h4>
              <ol className="space-y-3 text-text-secondary text-sm">
                {["Share your vision with us", "We create design concepts", "Approve design & materials", "4-8 weeks of crafting", "Delivery & installation"].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="text-gold font-serif text-lg leading-none">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="p-8 md:p-10 border border-border bg-bg-card luxury-shadow">
              <h3 className="font-serif text-2xl text-cream mb-8">Enquiry Form</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className={labelClass}>Full Name *</label>
                  <input id="name" name="name" type="text" required placeholder="Your full name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email Address *</label>
                  <input id="email" name="email" type="email" required placeholder="your@email.com" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone Number *</label>
                  <div className="flex">
                    <span className="bg-bg-hover border border-border border-r-0 px-3 flex items-center text-text-muted text-sm">+91</span>
                    <input id="phone" name="phone" type="tel" required placeholder="96359 45687" className={`${inputClass} border-l-0`} />
                  </div>
                </div>
                 <div>
                  <label htmlFor="category" className={labelClass}>Product Category</label>
                  <select id="category" name="category" className={inputClass}>
                    <option value="">Select category</option>
                    {(dbCategories.length > 0 ? dbCategories : PRODUCT_CATEGORIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="budget" className={labelClass}>Budget Range</label>
                  <select id="budget" name="budget" className={inputClass}>
                    <option value="">Select budget range</option>
                    {BUDGET_RANGES.map((b) => (<option key={b} value={b}>{b}</option>))}
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="message" className={labelClass}>Message / Project Description</label>
                <textarea id="message" name="message" rows={5} placeholder="Tell us about your dream piece — dimensions, colors, inspiration..." className={inputClass} />
              </div>
              <div className="mb-8">
                <label className={labelClass}>Inspiration Images (Optional)</label>
                <div className="border border-dashed border-border hover:border-gold/50 p-6 text-center transition-colors cursor-pointer relative">
                  <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { if (e.target.files) setFiles(Array.from(e.target.files)); }} />
                  <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">Drop files here or click to upload</p>
                  <p className="text-text-muted text-xs mt-1">PNG, JPG up to 10MB each</p>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {files.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-bg-hover px-3 py-1 text-xs text-text-secondary">
                        {f.name}
                        <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={formState === "submitting"} className="btn-luxury btn-gold w-full md:w-auto group">
                {formState === "submitting" ? "Submitting..." : 
                 formState === "error" ? "Try Again" : "Submit Enquiry"}
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              {formState === "error" && (
                <p className="text-red-500 text-xs mt-2">Something went wrong. Please check fields or try again later.</p>
              )}
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
