import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <span className="font-bold text-xl">A</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">AMAC Pay</h3>
                <p className="text-sm text-primary-foreground/70">Official Payment Portal</p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              The official online payment platform for Abuja Municipal Area Council. 
              Pay your levies and taxes quickly, securely, and conveniently.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: "All Services", href: "/services" },
                { label: "Check Payment Status", href: "/check-status" },
                { label: "Download Receipt", href: "/receipt" },
                { label: "FAQ", href: "/faq" },
                { label: "About AMAC", href: "/about" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Popular Services</h4>
            <ul className="space-y-3">
              {[
                { label: "Tenement Rate", href: "/pay/tenement-rate" },
                { label: "Shop & Kiosk License", href: "/pay/shop-kiosk-a" },
                { label: "Hotel License", href: "/pay/hotel-license" },
                { label: "POS License", href: "/pay/pos-license-a" },
                { label: "Fumigation Service", href: "/pay/fumigation" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Toll-Free: 0800-AMAC-PAY</p>
                  <p className="text-sm text-primary-foreground/70">+234 803 123 4567</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">support@amacpay.ng</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary-foreground/80">
                  AMAC Secretariat, Area 10, Garki, Abuja FCT
                </p>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary-foreground/80">
                  Mon - Fri: 8:00 AM - 6:00 PM
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/70">
              © {new Date().getFullYear()} Abuja Municipal Area Council. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">
                Terms of Service
              </Link>
              <a 
                href="https://amac.gov.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1"
              >
                AMAC Website <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
