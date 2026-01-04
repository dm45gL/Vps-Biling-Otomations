
import 'dotenv/config'; 
import http from 'http';
import app from './app'; 
import { connectRedis } from './core/db/redis';
import { prisma } from './core/db/client';
import "./modules/loging/services/promoUsageCron";
import './modules/backup/services/backup.scheduler';


const startServer = async () => {
  try {
    await connectRedis();

    const PORT = Number(process.env.PORT) || 3000;
    const server = http.createServer(app);

    // ── Graceful shutdown ─────────────
    const shutdown = async () => {
      console.log('\nShutting down...');
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('Database disconnected.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // ── Start server ─────────────
    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

startServer();
