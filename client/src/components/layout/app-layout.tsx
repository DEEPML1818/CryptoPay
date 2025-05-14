import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // Create state to store the page title
  const [pageTitle, setPageTitle] = useState("Dashboard");

  // Optional: add a method to update the page title from child components
  const updatePageTitle = (title: string) => {
    setPageTitle(title);
    // Also update the document title
    document.title = `${title} - CryptoPay`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <div className="flex-1 overflow-x-hidden">
        <Header 
          mobileMenuButton={<Sidebar />} 
          title={pageTitle}
        />
        
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
