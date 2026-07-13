import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { InstagramIcon as Instagram } from "@/components/ui/Icons";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, NAV_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="font-serif text-2xl tracking-[0.15em] text-cream mb-2">
              ARTIZIVA
            </h3>
            <p className="text-[0.65rem] tracking-[0.3em] text-text-muted uppercase mb-4">
              HOMES
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Handcrafting bespoke epoxy &amp; resin masterpieces for luxury
              homes since 2024. Every piece is one-of-one.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-border hover:border-gold hover:bg-gold/10 transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-text-secondary group-hover:text-gold transition-colors" />
              </a>
              <a
                href="mailto:hello@artizivahomes.com"
                className="p-2.5 border border-border hover:border-gold hover:bg-gold/10 transition-all duration-300 group"
                aria-label="Email"
              >
                <Mail className="w-4 h-4 text-text-secondary group-hover:text-gold transition-colors" />
              </a>
              <a
                href="tel:+919635945687"
                className="p-2.5 border border-border hover:border-gold hover:bg-gold/10 transition-all duration-300 group"
                aria-label="Phone"
              >
                <Phone className="w-4 h-4 text-text-secondary group-hover:text-gold transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-gold mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-cream text-sm transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/admin/login"
                  className="text-text-muted hover:text-text-secondary text-xs transition-colors duration-300"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-gold mb-6">
              Collections
            </h4>
            <ul className="space-y-3">
              {[
                "Dining Tables",
                "Coffee Tables",
                "Wall Art",
                "Clocks",
                "Custom Pieces",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/shop"
                    className="text-text-secondary hover:text-cream text-sm transition-colors duration-300"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-gold mb-6">
              Get in Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-text-secondary text-sm">
                  Siliguri, West Bengal
                  <br />
                  India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a
                  href="tel:+919635945687"
                  className="text-text-secondary hover:text-cream text-sm transition-colors"
                >
                  +91 96359 45687
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a
                  href="mailto:hello@artizivahomes.com"
                  className="text-text-secondary hover:text-cream text-sm transition-colors"
                >
                  hello@artizivahomes.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Instagram className="w-4 h-4 text-gold shrink-0" />
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-cream text-sm transition-colors"
                >
                  {INSTAGRAM_HANDLE}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs tracking-wider">
            © {new Date().getFullYear()} Artiziva Homes. All rights reserved.
          </p>
          <p className="text-text-muted text-xs tracking-wider">
            Handcrafted with ♥ in Siliguri, India
          </p>
        </div>
      </div>
    </footer>
  );
}
