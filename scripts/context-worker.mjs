// Local durable retry runner. Never targets a configurable or production URL.
let stopped = false;
process.on("SIGINT", () => {
  stopped = true;
});
process.on("SIGTERM", () => {
  stopped = true;
});
while (!stopped) {
  try {
    const response = await fetch(
      "http://localhost:3100/api/cron/project-context",
      {
        headers: { Authorization: "Bearer context-local-worker" },
        signal: AbortSignal.timeout(125000),
      },
    );
    if (!response.ok)
      console.error(`Context worker returned ${response.status}`);
  } catch {
    console.error("Context dev server not ready; retrying.");
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
