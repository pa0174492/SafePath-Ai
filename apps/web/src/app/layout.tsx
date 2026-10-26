import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SafePath-AI: Uncertainty-Aware Multi-Objective Urban Routing",
  description: "A research-grade multi-objective routing platform optimizing for travel time, safety risk, accessibility burden, and environmental resilience.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-500 bg-white">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span>SafePath-AI Urban Mobility Framework • India Navigation Edition</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700">Kakatiya Institute of Technology & Science (KITS Warangal)</span>
              </span>
              <span className="font-mono text-slate-400">OpenStreetMap • OSRM Foot • CartoDB • Nominatim</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

