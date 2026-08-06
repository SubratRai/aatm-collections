import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { SiteProvider } from './SiteContext';
import { RequireAdmin, RequireAuth, StoreLayout } from './Layout';
import {
  CartPage,
  HomePage,
  LoginPage,
  OrdersPage,
  ProductPage,
  WebsiteConfigPage,
} from './pages';
import './App.css';

export default function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<StoreLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products/:id" element={<ProductPage />} />
              <Route path="login" element={<LoginPage />} />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SiteProvider>
  );
}
