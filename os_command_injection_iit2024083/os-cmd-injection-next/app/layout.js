export const metadata = { title: "NetTools - Ping Utility" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f4f6f9", color: "#1d2733" }}>
        {children}
      </body>
    </html>
  );
}
