import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from "./pages/MainPage.jsx";

function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api')
            .then((res) => res.json())
            .then((data) => setMessage(data.message));
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
            </Routes>
        </Router>
    );
}

export default App;