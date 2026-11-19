import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { TripProvider } from './store/TripStore.jsx';
import 'antd/dist/reset.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#276459',
          colorText: '#1d302d',
          colorTextSecondary: '#78827e',
          colorBorder: '#e8e9e2',
          colorBgContainer: '#ffffff',
          borderRadius: 14,
          fontFamily: 'DM Sans, sans-serif',
          controlHeight: 42,
        },
      }}
    >
      <TripProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </TripProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
