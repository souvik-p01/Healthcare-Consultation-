import { useState } from 'react';
import Home from './Pages/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import About from './Pages/About';
import Service from './Pages/Service';
import './index.css'
import { Routes, Route } from 'react-router-dom';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col justify-center min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Service />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
