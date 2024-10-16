import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import "./globals.css";



//import { cn } from "@/lib/utils";
//import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { PropsWithChildren } from "react";
import { AutoConnectProvider } from "../components/AutoConnectProvider";
import { Toaster } from "../components/ui/toaster";
import { ThemeProvider } from "../components/ThemeProvider";
import { WalletProvider } from "../components/WalletProvider";
import { cn } from "../utils/utils";


const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  description:
    "An example of how to use Aptos Wallet Adapter with React and Next.js.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "flex justify-center min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AutoConnectProvider>
            <WalletProvider>
              {children}
              <Toaster />
            </WalletProvider>
          </AutoConnectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
