import "../src/styles.css";

export const metadata = {
  title: "Vichola",
  description: "Sikh Punjabi matchmaking app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0d3f3a" />
      </head>
      <body>{children}</body>
    </html>
  );
}
