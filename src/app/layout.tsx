import type { Metadata } from "next";
import { creatoDisplay } from "@/lib/fonts";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElementPay — Move Business Money at Internet Speed",
  description:
    "The financial operating system for modern businesses. Payroll, treasury, vendor payments, and global settlements — all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${creatoDisplay.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
