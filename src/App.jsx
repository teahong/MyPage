import { Route, Routes } from 'react-router';
import AdminRoute from './components/AdminRoute.jsx';
import Header from './components/Header.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import WorkDetailPage from './pages/WorkDetailPage.jsx';
import WorkEditPage from './pages/WorkEditPage.jsx';
import WorkNewPage from './pages/WorkNewPage.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work/:id" element={<WorkDetailPage />} />
        <Route
          path="/admin/new"
          element={
            <AdminRoute>
              <WorkNewPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <AdminRoute>
              <WorkEditPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
