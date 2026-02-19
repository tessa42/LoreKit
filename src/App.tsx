import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './i18n';
import Header from './components/Header';
import Home from './pages/Home';
import LoreCraft from './pages/LoreCraft';
import LoreCheck from './pages/LoreCheck';
import Simulator from './pages/Simulator';
import './App.css';

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <div className="star-field" aria-hidden />
        <Header />
        <main>
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/lorecraft"  element={<LoreCraft />} />
            <Route path="/lorecheck"  element={<LoreCheck />} />
            <Route path="/simulator"  element={<Simulator />} />
          </Routes>
        </main>
      </BrowserRouter>
    </LangProvider>
  );
}
