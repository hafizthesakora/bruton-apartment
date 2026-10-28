import { Jost, Cormorant_Garamond } from 'next/font/google';
import ClientWrapper from './ClientWrapper';
import './globals.css';

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

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
    <html lang="en" suppressHydrationWarning className={`${jost.variable} ${cormorant.variable}`}>
      <body className="font-sans">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
