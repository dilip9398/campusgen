import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Kin | Siddhartha, connected",
  description: "A private campus dating circle for verified Siddhartha Educational Institutions students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
