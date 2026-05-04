import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The chat assistant reads markdown knowledge files from
  // src/data/knowledge/ at runtime via fs.readFileSync. Because the path is
  // built from process.cwd() and a variable filename, @vercel/nft can't
  // statically trace those reads — so without this, the .md files won't be
  // bundled into the serverless function and the system prompt would ship
  // empty in production (no bio, no scoping rules, no guardrails).
  outputFileTracingIncludes: {
    "/api/chat": ["./src/data/knowledge/**/*.md"],
    "/api/chat/end": ["./src/data/knowledge/**/*.md"],
  },
};

export default nextConfig;
