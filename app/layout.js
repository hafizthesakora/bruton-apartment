import ClientWrapper from "./ClientWrapper";

export const metadata = {
  title: "Ozalams - Find Your Perfect Home",
  description:
    "Discover your dream property with Ozalams' comprehensive search tools and expert guidance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
