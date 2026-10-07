import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Security', href: '#security' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleScroll = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Brand Logo */}
          <Link to={PAGE_ROUTES.HOME} className="flex items-center gap-3 group focus:outline-none">
            <img 
              src="/Logo-2.png" 
              alt="Tradevu HR" 
              className="h-8 sm:h-9 w-auto object-contain transition-opacity group-hover:opacity-90" 
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Action CTAs - Preserving exact original texts: "Log in" and "Get Started" */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to={PAGE_ROUTES.LOGIN}>
              <Button 
                variant="ghost" 
                className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-4"
              >
                Log in
              </Button>
            </Link>
            <Link to={PAGE_ROUTES.REGISTER}>
              <Button 
                className="bg-primary-100 hover:bg-primary-100/90 text-white text-sm font-medium rounded-lg px-4 shadow-sm transition-colors"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-base font-medium text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-3">
            <Link to={PAGE_ROUTES.LOGIN} className="w-full">
              <Button variant="outline" className="w-full border-slate-200 text-slate-800 rounded-lg">
                Log in
              </Button>
            </Link>
            <Link to={PAGE_ROUTES.REGISTER} className="w-full">
              <Button className="w-full bg-primary-100 hover:bg-primary-100/90 text-white rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
