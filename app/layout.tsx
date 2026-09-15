import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthGuard from "./components/AuthGuard";

import ReduxProvider from "./components/ReduxProvider";
import { PlanProvider } from "@/lib/context/PlanContext";
import { SidebarProvider } from "@/lib/context/SidebarContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brifix – Smart Investing Platform",
  description: "AI-powered stock trading platform with real-time data, predictions, and portfolio management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ReduxProvider>
          <PlanProvider>
            <SidebarProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </SidebarProvider>
          </PlanProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
