import "./globals.css";

export const metadata = {
  title: "Pluggable AI Recommender POC",
  description: "Dynamic questionnaire and pluggable recommendation sources"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
