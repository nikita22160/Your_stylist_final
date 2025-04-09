import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import StylistsCatalog from './pages/StylistsCatalog.jsx';
import StylistProfile from './pages/StylistProfile.jsx';
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
            </Routes>
        </Router>
    );
}

export default App;