export function GET() {
  if (process.env.ENABLE_API_DOCS !== "true") {
    return new Response("Not found", { status: 404 });
  }

  const html = `<!doctype html>
<html>
  <head>
    <title>GreenPlus Client API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api/openapi", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html" } });
}
