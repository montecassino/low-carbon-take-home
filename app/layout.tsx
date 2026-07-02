import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Low Carbon Materials Hub",
  description:
    "Compare embodied carbon in concrete products — stage by stage, with full source traceability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3">
              <a href="/" className="text-xl font-semibold tracking-tight text-gray-900 hover:text-carbon-700">
                Low Carbon Materials Hub
              </a>
              <span className="text-sm text-gray-400">concrete EPD comparison</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="mt-16 border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400 sm:px-6 lg:px-8">
            All carbon figures are sourced directly from third-party verified EPDs. A figure marked{" "}
            <strong>Not reported</strong> means data was not declared — it is{" "}
            <em>not</em> the same as zero.
          </div>
        </footer>
      </body>
    </html>
  );
}
