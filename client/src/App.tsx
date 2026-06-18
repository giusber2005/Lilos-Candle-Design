import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart-context";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { ContentProvider } from "@/lib/content-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageTracking } from "@/hooks/use-page-tracking";
import AdminAnalyticsPage from "@/pages/admin/AnalyticsPage";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import AboutPage from "@/pages/AboutPage";
import HowMadePage from "@/pages/HowMadePage";
import NotFound from "@/pages/not-found";
import MaintenancePage from "@/pages/MaintenancePage";
import AdminLoginPage from "@/pages/admin/LoginPage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminOrdersPage from "@/pages/admin/OrdersPage";
import AdminProductsPage from "@/pages/admin/ProductsPage";
import AdminContentPage from "@/pages/admin/ContentPage";
import AdminCommentsPage from "@/pages/admin/CommentsPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";
import AdminNewsletterPage from "@/pages/admin/NewsletterPage";

const queryClient = new QueryClient();

function ProtectedAdmin({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Redirect to="/admin" />;
  return <Component />;
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/admin/dashboard">
        <ProtectedAdmin component={AdminDashboardPage} />
      </Route>
      <Route path="/admin/orders">
        <ProtectedAdmin component={AdminOrdersPage} />
      </Route>
      <Route path="/admin/products">
        <ProtectedAdmin component={AdminProductsPage} />
      </Route>
      <Route path="/admin/content">
        <ProtectedAdmin component={AdminContentPage} />
      </Route>
      <Route path="/admin/comments">
        <ProtectedAdmin component={AdminCommentsPage} />
      </Route>
      <Route path="/admin/newsletter">
        <ProtectedAdmin component={AdminNewsletterPage} />
      </Route>
      <Route path="/admin/settings">
        <ProtectedAdmin component={AdminSettingsPage} />
      </Route>
      <Route path="/admin/analytics">
        <ProtectedAdmin component={AdminAnalyticsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ShopRouter() {
  usePageTracking();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/products/:slug" component={ProductDetailPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order/:id" component={OrderConfirmationPage} />
          <Route path="/orders" component={MyOrdersPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/how-made" component={HowMadePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const [shutdown, setShutdown] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-status")
      .then((r) => r.json())
      .then((d) => setShutdown(d.shutdown === true))
      .catch(() => setShutdown(false));
  }, []);

  if (location.startsWith("/admin")) return <AdminRouter />;

  // Brief dark hold while checking — avoids flash of shop then maintenance
  if (shutdown === null) {
    return <div className="min-h-screen bg-[#2C2826]" />;
  }
  if (shutdown) return <MaintenancePage />;
  return <ShopRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <ContentProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </CartProvider>
        </ContentProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
