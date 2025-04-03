import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from "./pages/MainPage.jsx";
import StylistsCatalog from "./pages/StylistsCatalog.jsx";

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/catalog" element={<StylistsCatalog/>} />
            </Routes>
        </Router>
    );
}

export default App;