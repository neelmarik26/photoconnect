import "./globals.css";

export const metadata = {
  title: "BookMyPhotographer | Find your photographer",
  description: "Find exceptional photographers for the moments that matter.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
