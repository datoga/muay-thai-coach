import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-6xl font-bold text-red-500">404</h1>
          <h2 className="mb-2 text-2xl font-semibold">Page Not Found</h2>
          <p className="mb-8 text-gray-500">
            The page you are looking for does not exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}

