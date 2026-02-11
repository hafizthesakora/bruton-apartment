import ClientWrapper from './ClientWrapper';

export const metadata = {
  title: 'Bruton Gardens & Apartments - Find Your Perfect Stay',
  description:
    "Discover luxury living on the outskirts of the city. Bruton Gardens & Apartments offers fully furnished short-stay apartments with world-class amenities.",
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
