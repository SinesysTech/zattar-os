"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "./ui/logo";
import { Menu } from "@mynaui/icons-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { getMeuProcessoUrl } from "@/lib/urls";

// Navigation configuration
type NavItem = {
  id: string;
  label: string;
  side: "left" | "right";
  isExternal?: boolean;
  href?: string;
};

const navigationItems: NavItem[] = [
  { id: "inicio", label: "Inicio", side: "left" },
  { id: "direitos-essenciais", label: "Direitos Essenciais", side: "left" },
  { id: "meu-processo", label: "Meu Processo", side: "right", isExternal: true, href: getMeuProcessoUrl() },
  { id: "quem-somos", label: "Quem Somos", side: "right" },
  { id: "consultoria", label: "Consultoria", side: "right" },
];

const Header = () => {
  const [activeSection, setActiveSection] = useState<string>("inicio");
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Smooth scroll function with offset for fixed header
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100; // Offset for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    // Close mobile drawer after navigation
    setIsOpen(false);
  };

  // Scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for active section detection
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    navigationItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Navigation Link Component
  const NavLink = ({
    item,
    isMobile = false,
  }: {
    item: NavItem;
    isMobile?: boolean;
  }) => {
    const isActive = activeSection === item.id;

    const baseClassName = cn(
      "relative px-4 py-2 text-sm font-medium transition-all duration-300",
      "hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-md",
      isActive ? "text-primary" : "text-foreground/80 hover:text-foreground",
      isMobile && "w-full text-left text-base py-3 px-0"
    );

    // Link externo (ex: Meu Processo)
    if (item.isExternal && item.href) {
      return (
        <Link
          href={item.href}
          className={baseClassName}
          onClick={() => setIsOpen(false)}
        >
          {item.label}
        </Link>
      );
    }

    // Link interno (scroll para secao)
    return (
      <button
        type="button"
        onClick={() => scrollToSection(item.id)}
        className={baseClassName}
        aria-current={isActive ? "page" : undefined}
      >
        {item.label}
        {isActive && !isMobile && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
        )}
        {isActive && isMobile && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
        )}
      </button>
    );
  };

  const leftItems = navigationItems.filter((item) => item.side === "left");
  const rightItems = navigationItems.filter((item) => item.side === "right");

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="relative">
        {/* Glass morphism background with dynamic opacity - full width */}
        <div
          className={cn(
            "absolute inset-0 -z-10 transition-all duration-300",
            isScrolled
              ? "bg-white/90 backdrop-blur-xl shadow-lg"
              : "bg-transparent backdrop-blur-none"
          )}
        ></div>

        <div className="relative py-1 px-4 md:py-2">
          <div className="container mx-auto max-w-7xl">
            {/* Desktop Navigation (768px and up) */}
            <nav
              className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-8"
              aria-label="Navegação principal"
            >
              {/* Left Navigation Items */}
              <div className="flex items-center gap-2 justify-end">
                {leftItems.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))}
              </div>

              {/* Centered Logo */}
              <div className="flex-shrink-0">
                <Logo />
              </div>

              {/* Right Navigation Items */}
              <div className="flex items-center gap-2 justify-start">
                {rightItems.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))}
              </div>
            </nav>

            {/* Mobile Navigation (below 768px) */}
            <div className="md:hidden flex items-center justify-between">
              {/* Hamburger Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger
                  className="p-2 hover:bg-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  aria-label="Abrir menu de navegação"
                  aria-expanded={isOpen}
                >
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[340px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">Navegação</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-8" aria-label="Navegação mobile">
                    {navigationItems.map((item) => (
                      <NavLink key={item.id} item={item} isMobile />
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>

              {/* Centered Logo */}
              <div className="absolute left-1/2 -translate-x-1/2">
                <Logo />
              </div>

              {/* Spacer for layout balance */}
              <div className="w-10"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
