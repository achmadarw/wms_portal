import type { Metadata } from 'next';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
    title: 'WMS - Warehouse Management System',
    description: 'Professional Warehouse Management System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang='en'>
            <body className='bg-gray-50'>
                <NextTopLoader
                    color='#2563eb'
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing='ease'
                    speed={200}
                    shadow='0 0 10px #2563eb,0 0 5px #2563eb'
                />
                {children}
            </body>
        </html>
    );
}
