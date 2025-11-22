'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { IconMenu2, IconX } from '@tabler/icons-react';

import { ButtonColorful } from '@/components/ui/button-colorful';
import { isAuthenticated } from '@/lib/api';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  return (
    <header className="border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src="/logo_dark.png" alt="AntiHub" className="h-8" />
          <span className="text-xl font-bold text-white">AntiHub</span>
        </div>
        
        <nav className="hidden lg:flex items-center gap-6">
        </nav>
        
        <div className="flex items-center gap-3">
              <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
                <ButtonColorful>{isLoggedIn ? "进入控制台" : "快速开始"}</ButtonColorful>
              </Link>
        </div>
      </div>
    </header>
  );
}
