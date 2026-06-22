// C:\Users\Siddharathan\Desktop\Grocery-Cart\components\Footer.jsx
'use client'

import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Carrot,
  Apple,
  Leaf,
  Milk,
  Shield,
  Crown,
  Store,
  HelpCircle,
  FileText,
  Scale,
} from "lucide-react";

const Footer = () => {

  const linkSections = [
    {
      title: "SHOP BY CATEGORY",
      links: [
        { text: "Vegetables", path: "/shop?category=Vegetables", icon: Carrot },
        { text: "Fruits", path: "/shop?category=Fruits", icon: Apple },
        { text: "Organic Products", path: "/shop?category=Organic%20Products", icon: Leaf },
        { text: "Daily Essentials", path: "/shop?category=Daily%20Essentials", icon: Milk },
      ]
    },
    {
      title: "CUSTOMER SERVICES",
      links: [
        { text: "Help Center", path: "/", icon: HelpCircle },
        { text: "Returns & Refunds", path: "/", icon: Shield },
        { text: "Premium Membership", path: "/pricing", icon: Crown },
        { text: "Start Selling", path: "/create-store", icon: Store },
      ]
    },
    {
      title: "LEGAL",
      links: [
        { text: "Terms of Service", path: "/", icon: FileText },
        { text: "Privacy Policy", path: "/", icon: Shield },
        { text: "Cookie Policy", path: "/", icon: FileText },
        { text: "Sitemap", path: "/", icon: Scale },
      ]
    },
    {
      title: "GET IN TOUCH",
      links: [
        { text: "+91 9344095727", path: "tel:+919344095727", icon: Phone },
        { text: "support@grocerycart.com", path: "mailto:support@grocerycart.com", icon: Mail },
        {
          text: "69 , Mettu Street,Srirangam, Trichy.",
          path: "https://maps.google.com",
          icon: MapPin
        },
      ]
    }
  ];

  const socialIcons = [
    { icon: Facebook, link: "https://www.facebook.com", color: "#4267B2" },
    { icon: Instagram, link: "https://www.instagram.com", color: "#C13584" },
    { icon: Twitter, link: "https://twitter.com", color: "#1DA1F2" },
    { icon: Linkedin, link: "https://www.linkedin.com", color: "#0077B5" },
  ];

  return (
    <footer className="bg-white border-t border-slate-200 pb-20 md:pb-0">
      {/* ↑ pb-20 fixes mobile bottom nav overlap */}

      <div className="max-w-7xl mx-auto px-6">

        {/* Main Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-12 border-b">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-4xl font-bold flex items-center">
              <span className="bg-green-500 text-white px-2 py-1 rounded-lg mr-1">
                Grocery
              </span>
              Cart<span className="text-green-600">.</span>
            </Link>

            <p className="mt-4 text-sm text-slate-500">
              Fresh groceries, fast delivery, and verified local stores.
            </p>

            <div className="flex gap-3 mt-6">
              {socialIcons.map((s, i) => (
                <Link
                  key={i}
                  href={s.link}
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center rounded-full border hover:shadow-md transition"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <s.icon size={18} color={s.color} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {linkSections.map((section, i) => (
            <div key={i}>
              <h3 className="font-bold text-sm mb-5 text-slate-800">
                {section.title}
              </h3>

              <ul className="space-y-3">
                {section.links.map((link, j) => {
                  const Icon = link.icon;
                  return (
                    <li key={j}>
                      <Link
                        href={link.path}
                        className="flex items-start gap-2 text-sm text-slate-500 hover:text-green-600 transition"
                      >
                        <Icon size={16} className="mt-0.5 text-green-600" />
                        <span>{link.text}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom */}
        <div className="py-6 flex flex-col gap-2 md:flex-row md:justify-between text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()}{" "}
            <Link href="/" className="text-green-600 hover:underline">
              Grocery Cart
            </Link>
            . All rights reserved.
          </p>

          <p>
            Designed & Developed by{" "}
            <Link
              href="https://buildmyweb.info/"
              target="_blank"
              className="text-green-600 hover:underline"
            >
              BuildMyWeb
            </Link>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;