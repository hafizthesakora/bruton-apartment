import ClientWrapper from './ClientWrapper';

export const metadata = {
  title: 'Bruton Apartment - Find Your Perfect Home',
  description:
    "Discover your dream property with Bruton Gardens' comprehensive search tools and expert guidance.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
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
