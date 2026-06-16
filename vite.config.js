import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxies exchange payment calls to the airline's real API
      '/api/exchange/purchase': {
        target: 'https://m.ethiopianairlines.com/flightexchange-exchangeapi/v1.0/api/Purchase/Purchase',
        changeOrigin: true,
        secure: false, // Critical for Cert environment
        rewrite: (path) => path.replace(/^\/api\/exchange\/purchase/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.removeHeader('isdevelopment');
            proxyReq.removeHeader('Isdevelopment');
            proxyReq.removeHeader('isDevelopment');
            proxyReq.removeHeader('IsDevelopment');
            proxyReq.setHeader('IsDevelopment', 'true');
            
            // Standard client headers from working API collection
            proxyReq.setHeader('IPAddress', '10.25.251.12');
            proxyReq.setHeader('AppVersion', '3.4.0 158');
            proxyReq.setHeader('Platform', 'Android');
            proxyReq.setHeader('DeviceModel', 'Samsung S9');
            
            proxyReq.removeHeader('riskifiedsessionid');
            proxyReq.removeHeader('Riskifiedsessionid');
            proxyReq.removeHeader('riskifiedSessionId');
            proxyReq.removeHeader('RiskifiedSessionId');
            proxyReq.setHeader('RiskifiedSessionId', '61f44cbd-1d53-4482-aa80-89245a46ca10');

            const sabreCookie = req.headers['x-sabre-cookie'];
            if (sabreCookie) {
              proxyReq.setHeader('Cookie', sabreCookie);
            }
          });
        }
      },
      // Proxies new booking payment calls to the airline's real API
      '/api/booking/purchase': {
        target: 'https://m.ethiopianairlines.com/flightbooking-bookingapi/v1.0/api/Purchase/Purchase',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/booking\/purchase/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.removeHeader('isdevelopment');
            proxyReq.removeHeader('Isdevelopment');
            proxyReq.removeHeader('isDevelopment');
            proxyReq.removeHeader('IsDevelopment');
            proxyReq.setHeader('IsDevelopment', 'true');

            // Standard client headers from working API collection
            proxyReq.setHeader('IPAddress', '10.25.251.12');
            proxyReq.setHeader('AppVersion', '3.4.0 158');
            proxyReq.setHeader('Platform', 'Android');
            proxyReq.setHeader('DeviceModel', 'Samsung S9');
            
            proxyReq.removeHeader('riskifiedsessionid');
            proxyReq.removeHeader('Riskifiedsessionid');
            proxyReq.removeHeader('riskifiedSessionId');
            proxyReq.removeHeader('RiskifiedSessionId');
            proxyReq.setHeader('RiskifiedSessionId', '61f44cbd-1d53-4482-aa80-89245a46ca10');

            const sabreCookie = req.headers['x-sabre-cookie'];
            if (sabreCookie) {
              proxyReq.setHeader('Cookie', sabreCookie);
            }
          });
        }
      }
    }
  }
})