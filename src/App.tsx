import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './i18n';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoreCraft from './pages/LoreCraft';
import LoreCheck from './pages/LoreCheck';
import Simulator from './pages/Simulator';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './App.css';

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="star-field" aria-hidden />
          <Header />
          <main>
            <Routes>
              <Route path="/"           element={<Home />} />
              <Route path="/lorecraft"  element={<LoreCraft />} />
              <Route path="/lorecheck"  element={<LoreCheck />} />
              <Route path="/simulator"  element={<Simulator />} />
              <Route path="/login"      element={<Login />} />
              <Route path="/signup"     element={<Signup />} />
              <Route path="/terms"      element={<Terms />} />
              <Route path="/privacy"    element={<Privacy />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
