import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WalletProvider } from '@/providers/WalletProvider';
import { UserProvider } from '@/providers/UserProvider';
import App from "./App";
import "./index.css";

// Create root and render app
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <WalletProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </WalletProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
