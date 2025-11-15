import React from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer, cssTransition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainPage from './pages/MainPage';

const fade = cssTransition({
  enter: 'fade-in',
  exit: 'fade-out',
});

const App: React.FC = () => {
  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <main className="min-h-screen font-inter">
        <MainPage />
        <ToastContainer
          transition={fade}
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
      </main>
    </Theme>
  );
}

export default App;