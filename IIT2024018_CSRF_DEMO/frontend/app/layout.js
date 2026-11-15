import "./globals.css";

export const metadata = {
  title: "DevForge — Team Portal",
  description: "CSRF privilege-escalation demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
