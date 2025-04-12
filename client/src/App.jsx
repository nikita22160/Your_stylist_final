import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import StylistsCatalog from './pages/StylistsCatalog.jsx';
import StylistProfile from './pages/StylistProfile.jsx';
import StylistPortfolio from './pages/StylistPortfolio.jsx'; // Импортируем страницу портфолио
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route
                    path="/catalog"
                    element={
                        <ProtectedRoute>
                            <StylistsCatalog />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/stylist/:id"
                    element={
                        <ProtectedRoute>
                            <StylistProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/stylist/:id/portfolio"
                    element={
                        <ProtectedRoute>
                            <StylistPortfolio />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;