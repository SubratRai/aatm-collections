import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { ToastStack } from './ToastStack';
import { SiteProvider } from './SiteContext';
import { RequireAdmin, RequireAuth, StoreLayout } from './Layout';
import {
  CartPage,
  CatalogSyncPage,
  HomePage,
  LoginPage,
  OrdersPage,
  ProductPage,
  WebsiteConfigPage,
} from './pages';
import {
  AboutPage,
  AccountPage,
  BlogListPage,
  BlogPostPage,
  ComparePage,
  ContactPage,
  PolicyPage,
  ShopPage,
  WishlistPage,
} from './storePages';
import './App.css';

export default function App() {
  return (
    <NotificationProvider>
      <SiteProvider>
        <AuthProvider>
          <BrowserRouter>
            <ToastStack />
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="products/:id" element={<ProductPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="blog" element={<BlogListPage />} />
                <Route path="blog/:slug" element={<BlogPostPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="compare" element={<ComparePage />} />
                <Route path="policy/privacy" element={<PolicyPage kind="privacy" />} />
                <Route path="policy/refunds" element={<PolicyPage kind="refunds" />} />
                <Route path="login" element={<LoginPage />} />
                <Route
                  path="account"
                  element={(
                    <RequireAuth>
                      <AccountPage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="cart"
                  element={(
                    <RequireAuth>
                      <CartPage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="orders"
                  element={(
                    <RequireAuth>
                      <OrdersPage />
                    </RequireAuth>
                  )}
                />
                <Route
                  path="admin/website"
                  element={(
                    <RequireAdmin>
                      <WebsiteConfigPage />
                    </RequireAdmin>
                  )}
                />
                <Route
                  path="admin/catalog"
                  element={(
                    <RequireAdmin>
                      <CatalogSyncPage />
                    </RequireAdmin>
                  )}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SiteProvider>
    </NotificationProvider>
  );
}
