// The build command creates this SSR bundle before Vercel bundles the function.
// Loading it avoids running the untransformed source through Vercel's bundler.
// @ts-expect-error The generated bundle is present after `npm run build`.
import app from "../dist/server.bundle.mjs";

export default app;