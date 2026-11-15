import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { AboutPage, ContactPage, FaqPage, LegalPage } from './pages/InfoPages';
import { AdminPage } from './pages/admin/AdminPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const StorefrontShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white text-[#111111]">
    <Navbar />
    <CartDrawer />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/*" element={<AdminPage />} />

          <Route path="/" element={<StorefrontShell><HomePage /></StorefrontShell>} />
          <Route path="/boutique" element={<StorefrontShell><CatalogPage mode="all" /></StorefrontShell>} />
          <Route path="/femme" element={<StorefrontShell><CatalogPage mode="femme" /></StorefrontShell>} />
          <Route path="/homme" element={<StorefrontShell><CatalogPage mode="homme" /></StorefrontShell>} />
          <Route path="/nouveautes" element={<StorefrontShell><CatalogPage mode="nouveautes" /></StorefrontShell>} />
          <Route path="/promotions" element={<StorefrontShell><CatalogPage mode="promotions" /></StorefrontShell>} />
          <Route path="/produit/:slug" element={<StorefrontShell><ProductDetailPage /></StorefrontShell>} />
          <Route path="/panier" element={<StorefrontShell><CartPage /></StorefrontShell>} />
          <Route path="/commande" element={<StorefrontShell><CheckoutPage /></StorefrontShell>} />
          <Route
            path="/commande/confirmation/:orderNumber"
            element={<StorefrontShell><OrderConfirmationPage /></StorefrontShell>}
          />
          <Route path="/compte" element={<StorefrontShell><AccountPage /></StorefrontShell>} />
          <Route path="/a-propos" element={<StorefrontShell><AboutPage /></StorefrontShell>} />
          <Route path="/contact" element={<StorefrontShell><ContactPage /></StorefrontShell>} />
          <Route path="/faq" element={<StorefrontShell><FaqPage /></StorefrontShell>} />
          <Route path="/cgv" element={<StorefrontShell><LegalPage type="cgv" /></StorefrontShell>} />
          <Route path="/confidentialite" element={<StorefrontShell><LegalPage type="privacy" /></StorefrontShell>} />
          <Route path="/retours" element={<StorefrontShell><LegalPage type="returns" /></StorefrontShell>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}
