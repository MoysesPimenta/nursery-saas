export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Nursery-SaaS API</h1>
      <p>Backend services for the Nursery-SaaS platform</p>
      <h2>Available Endpoints</h2>
      <ul>
        <li>
          <strong>Health Check:</strong> GET /api/v1/health
        </li>
        <li>
          <strong>GraphQL:</strong> POST /api/graphql (PostGraphile)
        </li>
        <li>
          <strong>Import:</strong> POST /api/v1/import
        </li>
        <li>
          <strong>Export:</strong> GET /api/v1/export
        </li>
        <li>
          <strong>Webhooks:</strong> POST /api/v1/webhooks
        </li>
        <li>
          <strong>tRPC:</strong> /api/trpc (for RPC calls)
        </li>
      </ul>
      <p>
        <small>Version: 0.1.0</small>
      </p>
    </main>
  );
}
