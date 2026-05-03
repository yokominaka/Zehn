/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Halaat from "./pages/Halaat";
import Sada from "./pages/Sada";
import Qalam from "./pages/Qalam";
import Nuskha from "./pages/Nuskha";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { useVibesStore } from "./store/vibes";

import Welcome from "./pages/Welcome";

function ProtectedRoutes() {
  const { user, loading, signIn } = useAuth();
  const initSync = useVibesStore(state => state.initSync);
  
  useEffect(() => {
    if (user) {
      initSync();
    } else {
      useVibesStore.getState().clearVibes();
      const unsub = useVibesStore.getState().unsubscribeFromFirestore;
      if (typeof unsub === 'function') unsub();
    }
  }, [user, initSync]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-surface text-text-primary text-xs uppercase tracking-widest font-bold">Waking Zehn...</div>;
  }
  
  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface p-6">
        <h1 className="text-4xl font-light tracking-tight text-text-primary mb-2">Zehn</h1>
        <p className="text-sm text-text-secondary font-medium tracking-wide uppercase mb-12">Emotional Texture Engine</p>
        <button 
          onClick={signIn}
          className="bg-text-primary text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return <AppLayout />;
}

let hasInitialized = false;

function RouteInterceptor({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  if (!hasInitialized && location.pathname !== "/") {
    hasInitialized = true;
    return <Navigate to="/" replace state={{ returnTo: location.pathname }} />;
  }
  
  hasInitialized = true;
  return <>{children}</>;
}

import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteInterceptor>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/app" element={<ProtectedRoutes />}>
              <Route index element={<Home />} />
              <Route path="halaat" element={<Halaat />} />
              <Route path="sada" element={<Sada />} />
              <Route path="qalam" element={<Qalam />} />
              <Route path="nuskha" element={<Nuskha />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </RouteInterceptor>
      </BrowserRouter>
      <Toaster position="top-center" theme="light" toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,0,0,0.05)',
          color: '#111',
          borderRadius: '16px'
        }
      }} />
    </AuthProvider>
  );
}
