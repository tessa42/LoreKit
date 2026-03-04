import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './i18n';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import './App.css';

const LoreCraft      = lazy(() => import('./pages/LoreCraft'));
const LoreCheck      = lazy(() => import('./pages/LoreCheck'));
const Simulator      = lazy(() => import('./pages/Simulator'));
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const Terms          = lazy(() => import('./pages/Terms'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const Refund         = lazy(() => import('./pages/Refund'));
const Pricing        = lazy(() => import('./pages/Pricing'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const MyPage         = lazy(() => import('./pages/MyPage'));

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="star-field" aria-hidden />
          <Header />
          <main>
            <Suspense>
              <Routes>
                <Route path="/"           element={<Home />} />
                <Route path="/lorecraft"  element={<LoreCraft />} />
                <Route path="/lorecheck"  element={<LoreCheck />} />
                <Route path="/simulator"  element={<Simulator />} />
                <Route path="/login"      element={<Login />} />
                <Route path="/signup"     element={<Signup />} />
                <Route path="/terms"            element={<Terms />} />
                <Route path="/privacy"          element={<Privacy />} />
                <Route path="/refund"           element={<Refund />} />
                <Route path="/pricing"          element={<Pricing />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/mypage"           element={<MyPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
