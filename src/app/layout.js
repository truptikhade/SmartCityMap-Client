"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Provider } from "react-redux";
import { store } from "@/store";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider store={store}>
          {children}
          <Toaster
            position="bottom-center"
            gutter={10}
            toastOptions={{
              duration: 3000,
              style: {
                background: "#fff",
                color: "#352b34",
                border: "1px solid #e6d7e2",
                borderRadius: "10px",
                boxShadow: "0 4px 16px rgba(44, 28, 41, 0.1)",
                fontSize: "14px",
                maxWidth: "calc(100vw - 32px)",
              },
              success: {
                iconTheme: {
                  primary: "#704766",
                  secondary: "#fff",
                },
              },
            }}
          />
        </Provider>
      </body>
    </html>
  );
}
