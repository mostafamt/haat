import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Menu from './pages/Menu';
import Menu2 from './pages/Menu2';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu-2" element={<Menu2 />} />
      </Routes>
    </BrowserRouter>
  );
}
