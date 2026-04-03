import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-bold text-primary/20">404</div>
      <h2 className="text-xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
        Go to Dashboard
      </Link>
    </div>
  );
}
