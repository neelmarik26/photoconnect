import "./globals.css";

export const metadata = {
  title: "PhotoConnect | Find your photographer",
  description: "Find exceptional photographers for the moments that matter.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
