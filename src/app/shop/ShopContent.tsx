"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { PRODUCTS, PRODUCT_CATEGORIES } from "@/lib/constants";

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹50,000", min: 0, max: 50000 },
  { label: "₹50K – ₹1L", min: 50000, max: 100000 },
  { label: "₹1L – ₹3L", min: 100000, max: 300000 },
  { label: "Above ₹3L", min: 300000, max: Infinity },
];

export default function ShopContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
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

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      const range = PRICE_RANGES[selectedPriceRange];
      if (p.price && (p.price < range.min || p.price > range.max)) return false;
      return true;
    });
  }, [selectedCategory, selectedPriceRange]);

  const categories = ["All", ...(dbCategories.length > 0 ? dbCategories : PRODUCT_CATEGORIES)];


  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 resin-gradient opacity-30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeading
            subtitle="Our Collection"
            title="Shop Masterpieces"
            description="Each piece is handcrafted, one-of-one. Browse our collection or commission something truly yours."
          />
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Category Filter Buttons */}
          <div className="flex items-center justify-start md:justify-center gap-2 mb-12 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase border whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat
                    ? "bg-gold text-bg-primary border-gold font-medium shadow-md shadow-gold/10"
                    : "border-border text-text-secondary hover:border-gold/50 hover:text-gold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
            <p className="text-text-secondary text-sm">{filtered.length} piece{filtered.length !== 1 ? "s" : ""}</p>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-xs tracking-widest uppercase text-text-secondary hover:text-gold transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filter by Price
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-8 p-6 border border-border bg-bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs tracking-widest uppercase text-gold">Price Filter</h3>
                <button onClick={() => { setSelectedPriceRange(0); }} className="text-xs text-text-muted hover:text-cream transition-colors">Clear Price</button>
              </div>
              <div>
                <p className="text-xs tracking-wider uppercase text-text-muted mb-3">Price Range</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range, i) => (
                    <button key={range.label} onClick={() => setSelectedPriceRange(i)}
                      className={`px-3 py-1.5 text-xs tracking-wider transition-all duration-300 ${
                        selectedPriceRange === i ? "bg-gold text-bg-primary" : "border border-border text-text-secondary hover:border-gold hover:text-gold"
                      }`}>{range.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}


          {/* Active Filters */}
          {(selectedCategory !== "All" || selectedPriceRange !== 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategory !== "All" && (
                <span className="flex items-center gap-1 px-3 py-1 bg-gold/10 border border-gold/30 text-gold text-xs">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("All")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedPriceRange !== 0 && (
                <span className="flex items-center gap-1 px-3 py-1 bg-gold/10 border border-gold/30 text-gold text-xs">
                  {PRICE_RANGES[selectedPriceRange].label}
                  <button onClick={() => setSelectedPriceRange(0)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-text-secondary text-lg font-serif mb-2">No pieces found</p>
              <p className="text-text-muted text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
