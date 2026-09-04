import "./globals.css";

export const metadata = {
  title: "Ghost Anti-Sleep Detector",
  description: "Absurd Hackathon Proj",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
