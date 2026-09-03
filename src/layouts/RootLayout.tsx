import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactElement } from 'react';
import { ScrollRestoration } from 'react-router';

import Footer from '@/layouts/parts/Footer';
import Header from '@/layouts/parts/Header';
import Website from '@/layouts/Website';
import { CartProvider } from '@/contexts/cart-context';

interface RootLayoutProps {
  children: ReactElement;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <CartProvider>
      <Website>
        <Helmet>
          <title>Blokpakt</title>
          <meta name="description" content="App Template" />
        </Helmet>
        <ScrollRestoration />
        <Header />
        {children}
        <Footer />
      </Website>
    </CartProvider>
  );
}
