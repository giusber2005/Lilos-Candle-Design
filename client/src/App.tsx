import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart-context";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { ContentProvider } from "@/lib/content-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
import AdminLoginPage from "@/pages/admin/LoginPage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminOrdersPage from "@/pages/admin/OrdersPage";
import AdminProductsPage from "@/pages/admin/ProductsPage";
import AdminContentPage from "@/pages/admin/ContentPage";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function ShopRouter() {
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
  if (location.startsWith("/admin")) {
    return <AdminRouter />;
  }
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
