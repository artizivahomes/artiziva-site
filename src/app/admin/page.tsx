"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Package, MessageSquare, ShoppingCart, FileText,
  Plus, Eye, Edit, Trash2, Search, Filter,
  CheckCircle, Clock, AlertCircle, LogOut, X,
  LayoutDashboard, Users, Settings,
} from "lucide-react";
import { PRODUCTS, PRODUCT_CATEGORIES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const statusColors: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  in_progress: "text-gold bg-gold/10 border-gold/30",
  completed: "text-success bg-success/10 border-success/30",
};

const statusIcons: Record<string, React.ElementType> = {
  new: AlertCircle,
  in_progress: Clock,
  completed: CheckCircle,
};

type Tab = "dashboard" | "products" | "enquiries" | "orders" | "billing" | "categories";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({
    title: "",
    category: "",
    price: "",
    price_on_request: false,
    short_description: "",
    description: "",
    is_sold: false,
    image_url: "",
  });

  useEffect(() => {
    fetchEnquiries();
    checkSuperadmin();
    fetchCategories();
    fetchOrders();
    fetchProducts();
  }, []);



  async function checkSuperadmin() {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        window.location.href = "/admin/login";
        return;
      }
      const { user } = await res.json();
      if (!user) {
        window.location.href = "/admin/login";
        return;
      }
      if (
        user.role === "superadmin" ||
        user.is_superadmin === true ||
        user.email === "artiziva.homes@gmail.com" ||
        user.email === "founder@artizivahomes.com"
      ) {
        setIsSuperadmin(true);
      }
    } catch (err) {
      console.error("Failed to check session status:", err);
      window.location.href = "/admin/login";
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    window.location.href = "/";
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/category");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch("/api/order");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data);
        } else {
          setDbProducts(PRODUCTS);
        }
      } else {
        setDbProducts(PRODUCTS);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setDbProducts(PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  }

  function openAddProductModal() {
    setEditingProduct(null);
    setProductForm({
      title: "",
      category: (categories.length > 0 ? categories[0].name : PRODUCT_CATEGORIES[0]) || "Dining Tables",
      price: "",
      price_on_request: false,
      short_description: "",
      description: "",
      is_sold: false,
      image_url: "",
    });
    setIsProductModalOpen(true);
  }

  function openEditProductModal(prod: any) {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title || "",
      category: prod.category || "Dining Tables",
      price: prod.price !== null && prod.price !== undefined ? prod.price.toString() : "",
      price_on_request: Boolean(prod.price_on_request || prod.priceOnRequest),
      short_description: prod.short_description || prod.shortDescription || "",
      description: prod.description || "",
      is_sold: Boolean(prod.is_sold || prod.isSold),
      image_url: (prod.images && prod.images[0]) || "",
    });
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        title: productForm.title,
        category: productForm.category,
        price: productForm.price_on_request ? null : Number(productForm.price),
        price_on_request: productForm.price_on_request,
        short_description: productForm.short_description,
        description: productForm.description,
        is_sold: productForm.is_sold,
        images: productForm.image_url ? [productForm.image_url] : [],
      };

      if (editingProduct && editingProduct.id) {
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
        if (res.ok) {
          const updated = await res.json();
          setDbProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...updated } : p));
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setDbProducts(prev => [created, ...prev]);
        }
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setDbProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  }

  async function updateOrderStatus(orderId: string, orderStatus: string) {
    try {
      const res = await fetch("/api/order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, order_status: orderStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? data : o));
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  }


  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(prev => [...prev, data]);
        setNewCatName("");
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  }

  async function saveEditedCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCatId || !editingCatName.trim()) return;
    try {
      const res = await fetch("/api/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCatId, name: editingCatName }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(prev => prev.map(c => c.id === editingCatId ? data : c));
        setEditingCatId(null);
        setEditingCatName("");
      }
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch("/api/category", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  }



  async function fetchEnquiries() {
    try {
      const res = await fetch("/api/enquiry");
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
    } finally {
      setLoadingEnquiries(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function deleteEnquiry(id: string) {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      const res = await fetch("/api/enquiry", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEnquiries(prev => prev.filter(e => e.id !== id));
      } else {
        alert("Failed to delete enquiry");
      }
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
    }
  }


  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "products" as Tab, label: "Products", icon: Package },
    { id: "categories" as Tab, label: "Categories", icon: Settings },
    { id: "enquiries" as Tab, label: "Enquiries", icon: MessageSquare },
    { id: "orders" as Tab, label: "Orders", icon: ShoppingCart },
    { id: "billing" as Tab, label: "Billing", icon: FileText },
  ];


  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-cream">Admin Panel</h1>
            <p className="text-text-muted text-sm">Manage your store, products, and enquiries</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-text-secondary hover:text-gold transition-colors tracking-widest uppercase cursor-pointer">
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 border-b border-border">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-wider uppercase whitespace-nowrap transition-all ${
                activeTab === tab.id ? "text-gold border-b-2 border-gold" : "text-text-secondary hover:text-cream"
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Products", value: PRODUCTS.length.toString(), icon: Package, color: "text-gold" },
                { label: "Active Enquiries", value: enquiries.filter(e => e.status !== "completed").length.toString(), icon: MessageSquare, color: "text-blue-400" },
                { label: "Orders", value: orders.length.toString(), icon: ShoppingCart, color: "text-success" },
                { label: "Revenue", value: `₹${orders.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + (o.subtotal || 0), 0).toLocaleString()}`, icon: FileText, color: "text-gold" },
              ].map((stat) => (
                <div key={stat.label} className="p-5 bg-bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="font-serif text-2xl text-cream">{stat.value}</p>
                  <p className="text-text-muted text-xs tracking-wider uppercase mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-bg-card border border-border">
                <h3 className="text-sm tracking-wider uppercase text-gold mb-4">Recent Enquiries</h3>
                <div className="space-y-3">
                  {loadingEnquiries ? (
                    <p className="text-text-muted text-xs p-3">Loading enquiries...</p>
                  ) : enquiries.length === 0 ? (
                    <p className="text-text-muted text-xs p-3">No enquiries yet</p>
                  ) : (
                    enquiries.slice(0, 5).map((e) => {
                      const StatusIcon = statusIcons[e.status] || AlertCircle;
                      return (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-bg-hover">
                          <div>
                            <p className="text-cream text-sm">{e.name}</p>
                            <p className="text-text-muted text-xs">
                              {e.product_category || e.category || (e.categories && e.categories[0]) || "Bespoke"} · {new Date(e.created_at || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-wider uppercase border ${statusColors[e.status] || statusColors.new}`}>
                            <StatusIcon className="w-3 h-3" /> {(e.status || "new").replace("_", " ")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="p-6 bg-bg-card border border-border">
                <h3 className="text-sm tracking-wider uppercase text-gold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Add Product", icon: Plus, action: () => setActiveTab("products") },
                    { label: "View Enquiries", icon: Eye, action: () => setActiveTab("enquiries") },
                    { label: "Manage Orders", icon: ShoppingCart, action: () => setActiveTab("orders") },
                    { label: "Generate Invoice", icon: FileText, action: () => setActiveTab("billing") },
                  ].map((item) => (
                    <button key={item.label} onClick={item.action} className="p-4 border border-border hover:border-gold text-left transition-colors group">
                      <item.icon className="w-5 h-5 text-text-muted group-hover:text-gold mb-2 transition-colors" />
                      <p className="text-cream text-sm">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="text" placeholder="Search products..." className="bg-bg-card border border-border pl-10 pr-4 py-2 text-sm text-cream placeholder:text-text-muted w-64 focus:border-gold transition-colors" />
                </div>
              </div>
              <button onClick={openAddProductModal} className="btn-luxury btn-gold text-xs py-2 px-4 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            <div className="border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-hover">
                    <tr>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Product</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Price</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProducts ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted text-xs">Loading products...</td></tr>
                    ) : dbProducts.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted text-xs">No products found</td></tr>
                    ) : (
                      dbProducts.map((p) => (
                        <tr key={p.id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 shrink-0 overflow-hidden">
                                <Image src={(p.images && p.images[0]) || "/images/placeholder.png"} alt={p.title} fill className="object-cover" />
                              </div>
                              <span className="text-cream font-medium">{p.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{p.category}</td>
                          <td className="px-4 py-3 text-gold">{(p.price_on_request || p.priceOnRequest) ? "On Request" : p.price ? formatPrice(p.price) : "On Request"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] tracking-wider uppercase border ${(p.is_sold || p.isSold) ? statusColors.completed : "text-success bg-success/10 border-success/30"}`}>
                              {(p.is_sold || p.isSold) ? "Sold" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditProductModal(p)} className="p-1.5 text-text-muted hover:text-gold transition-colors cursor-pointer" title="Edit"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-text-muted hover:text-error transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enquiries Tab */}
        {activeTab === "enquiries" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-hover">
                    <tr>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Client</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Budget</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Date</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Status</th>
                      {isSuperadmin && (
                        <th className="text-right px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEnquiries ? (
                      <tr>
                        <td colSpan={isSuperadmin ? 6 : 5} className="px-4 py-8 text-center text-text-muted text-xs">Loading enquiries...</td>
                      </tr>
                    ) : enquiries.length === 0 ? (
                      <tr>
                        <td colSpan={isSuperadmin ? 6 : 5} className="px-4 py-8 text-center text-text-muted text-xs">No enquiries found</td>
                      </tr>
                    ) : (
                      enquiries.map((e) => {
                        return (
                          <tr key={e.id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-cream font-medium">{e.name}</p>
                              <p className="text-text-muted text-xs">{e.email} · {e.phone}</p>
                              {e.message || e.style_description ? (
                                <p className="text-text-secondary text-xs mt-1 bg-white/5 p-2 rounded-sm italic max-w-lg">
                                  {e.message || e.style_description}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {e.product_category || e.category || (e.categories && e.categories.join(", ")) || "Bespoke"}
                            </td>
                            <td className="px-4 py-3 text-gold text-xs">{e.budget_range || e.budget || "N/A"}</td>
                            <td className="px-4 py-3 text-text-secondary text-xs">
                              {new Date(e.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={e.status || "new"}
                                onChange={(evt) => updateStatus(e.id, evt.target.value)}
                                className="bg-bg-card border border-border px-2 py-1 text-xs text-cream outline-none focus:border-gold"
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            {isSuperadmin && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => deleteEnquiry(e.id)}
                                  className="p-1.5 text-text-muted hover:text-error transition-colors"
                                  title="Delete Enquiry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form panel */}
              <div className="md:col-span-1 p-6 bg-bg-card border border-border">
                {editingCatId ? (
                  <form onSubmit={saveEditedCategory}>
                    <h3 className="text-sm tracking-wider uppercase text-gold mb-4">Edit Category</h3>
                    <div className="mb-4">
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2">Category Name</label>
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        required
                        className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-luxury btn-gold text-xs py-1.5 px-3">Save</button>
                      <button type="button" onClick={() => setEditingCatId(null)} className="border border-border text-text-secondary text-xs py-1.5 px-3 hover:text-cream">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={addCategory}>
                    <h3 className="text-sm tracking-wider uppercase text-gold mb-4">Add Category</h3>
                    <div className="mb-4">
                      <label className="block text-xs uppercase tracking-wider text-text-secondary mb-2">Category Name</label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Dining Tables"
                        required
                        className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                      />
                    </div>
                    <button type="submit" className="btn-luxury btn-gold text-xs py-1.5 px-3">Add Category</button>
                  </form>
                )}
              </div>

              {/* Table panel */}
              <div className="md:col-span-2 border border-border overflow-hidden bg-bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-hover">
                      <tr>
                        <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Name</th>
                        <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Slug</th>
                        <th className="text-right px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCategories ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-text-muted text-xs">Loading categories...</td>
                        </tr>
                      ) : categories.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-text-muted text-xs">No categories found</td>
                        </tr>
                      ) : (
                        categories.map((c) => (
                          <tr key={c.id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                            <td className="px-4 py-3 text-cream font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-text-secondary text-xs">{c.slug}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }}
                                  className="p-1.5 text-text-muted hover:text-gold transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteCategory(c.id)}
                                  className="p-1.5 text-text-muted hover:text-error transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="border border-border overflow-hidden bg-bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-hover">
                    <tr>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Customer</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Items</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Booking Paid</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Order Total</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Date</th>
                      <th className="text-left px-4 py-3 text-text-muted text-xs tracking-wider uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted text-xs">Loading orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted text-xs">No orders placed yet</td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-cream font-medium">{o.customer_name}</p>
                            <p className="text-text-muted text-xs">{o.customer_email} · {o.customer_phone}</p>
                            <p className="text-text-secondary text-[11px] mt-1 italic">{o.customer_address}, {o.customer_city} - {o.customer_pin}</p>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            <div className="space-y-1">
                              {o.items && o.items.map((item: any, idx: number) => (
                                <p key={idx}>
                                  {item.product?.title || "Product"} <span className="text-gold">x{item.quantity}</span>
                                </p>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gold text-xs">
                            <p className="font-semibold">{formatPrice(Math.min(o.subtotal * 0.5, 51000))}</p>
                            <p className="text-[10px] text-text-muted">ID: {o.payment_id || "N/A"}</p>
                          </td>
                          <td className="px-4 py-3 text-cream font-medium">{formatPrice(o.subtotal)}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            {new Date(o.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={o.order_status || "pending"}
                              onChange={(evt) => updateOrderStatus(o.id, evt.target.value)}
                              className="bg-bg-card border border-border px-2 py-1 text-xs text-cream outline-none focus:border-gold"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}


        {/* Billing Tab */}
        {activeTab === "billing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="font-serif text-xl text-cream mb-2">Billing & GST</p>
            <p className="text-text-muted text-sm mb-4">Invoice generation and GST filing tools coming soon.</p>
            <p className="text-text-muted text-xs">This section will support basic invoice generation and export for manual GST filing.</p>
          </motion.div>
        )}

        {/* Product Modal */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-bg-card border border-border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto luxury-shadow">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
                <h3 className="font-serif text-lg text-cream">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <button onClick={() => setIsProductModalOpen(false)} className="text-text-muted hover:text-cream cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. Royal Teak Dining Table"
                    className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                    >
                      {(categories.length > 0 ? categories.map(c => c.name) : PRODUCT_CATEGORIES).map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Price (₹)</label>
                    <input
                      type="number"
                      disabled={productForm.price_on_request}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="e.g. 250000"
                      className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.price_on_request}
                      onChange={(e) => setProductForm({ ...productForm, price_on_request: e.target.checked })}
                      className="accent-gold"
                    />
                    Price on Request
                  </label>

                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.is_sold}
                      onChange={(e) => setProductForm({ ...productForm, is_sold: e.target.checked })}
                      className="accent-gold"
                    />
                    Mark as Sold
                  </label>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Image URL</label>
                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="e.g. /images/products/emerald-dining-table.png"
                    className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Short Description</label>
                  <input
                    type="text"
                    value={productForm.short_description}
                    onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
                    placeholder="Brief summary for cards"
                    className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Detailed product story..."
                    className="w-full bg-bg-hover border border-border px-3 py-2 text-cream text-sm focus:border-gold outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 border border-border text-xs text-text-secondary hover:text-cream cursor-pointer">Cancel</button>
                  <button type="submit" className="btn-luxury btn-gold text-xs py-2 px-6 cursor-pointer">Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

