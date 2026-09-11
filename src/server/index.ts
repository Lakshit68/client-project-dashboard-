import http from 'http';
import app from './app';
import { env } from './config/env';
import { socketService } from './services/socket.service';
import { startOverdueTaskScheduler } from './services/scheduler.service';

const server = http.createServer(app);

// Initialize Socket.io server
socketService.init(server);

// Start Overdue Task Background Cron Job
startOverdueTaskScheduler();

server.listen(env.PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Agency Project Dashboard Server running on port ${env.PORT}`);
  console.log(`🌐 CORS Allowed Origin: ${env.CORS_ORIGIN}`);
  console.log(`=================================================`);
});
