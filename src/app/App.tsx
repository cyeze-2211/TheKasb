import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          style: { background: '#1F2937', color: '#fff', border: '1px solid #374151' },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
