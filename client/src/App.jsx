import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import StylistsCatalog from './pages/StylistsCatalog.jsx';
import StylistProfile from './pages/StylistProfile.jsx';
import StylistPortfolio from './pages/StylistPortfolio.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/catalog" element={<StylistsCatalog />} />
                <Route path="/stylist/:id" element={<StylistProfile />} />
                <Route path="/stylist/:id/portfolio" element={<StylistPortfolio />} />
            </Routes>
        </Router>
    );
}

export default App;