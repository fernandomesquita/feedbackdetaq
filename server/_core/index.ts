import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// OAuth removed - using local auth only
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { uploadRouter } from "../upload";
import mysql from "mysql2/promise";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn('[Migration] DATABASE_URL not set, skipping migrations');
    return;
  }

  let connection;
  try {
    console.log('[Migration] Connecting to database...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    // Check if quesitos table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'quesitos'"
    );

    if ((tables as any[]).length > 0) {
      console.log('[Migration] Table "quesitos" already exists, skipping migration');
      return;
    }

    console.log('[Migration] Creating table "quesitos"...');

    // Create quesitos table
    await connection.query(`
      CREATE TABLE \`quesitos\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`titulo\` varchar(255) NOT NULL,
        \`descricao\` text,
        \`ordem\` int NOT NULL DEFAULT 0,
        \`isActive\` boolean NOT NULL DEFAULT true,
        \`userId\` int NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`quesitos_id\` PRIMARY KEY(\`id\`)
      )
    `);

    console.log('[Migration] Creating indexes...');

    // Create indexes
    await connection.query('CREATE INDEX `user_idx` ON `quesitos` (`userId`)');
    await connection.query('CREATE INDEX `ordem_idx` ON `quesitos` (`ordem`)');
    await connection.query('CREATE INDEX `is_active_idx` ON `quesitos` (`isActive`)');

    console.log('[Migration] ✓ Table "quesitos" created successfully');
  } catch (error: any) {
    console.error('[Migration] Failed to run migrations:', error.message);
    // Don't exit - allow server to start even if migrations fail
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function startServer() {
  // Run migrations before starting server
  await runMigrations();

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth removed - using local auth only
  // Upload route
  app.use("/api", uploadRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
