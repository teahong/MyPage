import { Route, Routes } from 'react-router';
import AdminRoute from './components/AdminRoute.jsx';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import WorkNewPage from './pages/WorkNewPage.jsx';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin/new"
          element={
            <AdminRoute>
              <WorkNewPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
