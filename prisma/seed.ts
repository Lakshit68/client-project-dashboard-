import { PrismaClient, Role, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agency.com',
      passwordHash,
      name: 'Victoria Vance (Admin)',
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm.sarah@agency.com',
      passwordHash,
      name: 'Sarah Connor (PM)',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm.marcus@agency.com',
      passwordHash,
      name: 'Marcus Holloway (PM)',
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'dev.ravi@agency.com',
      passwordHash,
      name: 'Ravi Kumar (Dev)',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev.alex@agency.com',
      passwordHash,
      name: 'Alex Mercer (Dev)',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev.elena@agency.com',
      passwordHash,
      name: 'Elena Rostova (Dev)',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev.liam@agency.com',
      passwordHash,
      name: 'Liam Vance (Dev)',
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Created 7 users (1 Admin, 2 PMs, 4 Devs)');

  // 2. Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      company: 'Acme Global Inc',
      email: 'contact@acme.com',
      phone: '+1-555-0199',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Nexus FinTech Systems',
      company: 'Nexus Financials Ltd',
      email: 'projects@nexusfin.com',
      phone: '+1-555-0288',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'BioTech Health',
      company: 'BioTech Innovations',
      email: 'info@biotechhealth.org',
      phone: '+1-555-0377',
    },
  });

  console.log('✅ Created 3 clients');

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'E-Commerce Platform Redesign',
      description: 'Modernizing legacy e-commerce platform with Next.js microservices & stripe integration.',
      clientId: client1.id,
      createdById: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Nexus Real-Time Trading API',
      description: 'High-frequency WebSocket API & dashboard for financial trading algorithms.',
      clientId: client2.id,
      createdById: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'BioTech Patient Portal',
      description: 'HIPAA-compliant Telehealth portal & mobile application for patients and specialists.',
      clientId: client3.id,
      createdById: pm2.id,
    },
  });

  console.log('✅ Created 3 projects');

  // Dates for tasks
  const now = new Date();
  const pastThreeDays = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastFiveDays = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const futureThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const futureSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 4. Create Tasks (5+ per project, 2+ overdue)
  // Project 1 Tasks
  const task1_1 = await prisma.task.create({
    data: {
      title: 'Implement Auth & Refresh Cookie Tokens',
      description: 'Secure JWT authentication with HttpOnly cookies & role middleware.',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: pastThreeDays, // OVERDUE
      isOverdue: true,
    },
  });

  const task1_2 = await prisma.task.create({
    data: {
      title: 'Stripe Payment Gateway Integration',
      description: 'Integrate Webhooks, Checkout, and Subscription Management.',
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureThreeDays,
      isOverdue: false,
    },
  });

  const task1_3 = await prisma.task.create({
    data: {
      title: 'Product Catalog Indexing in Elasticsearch',
      description: 'Fuzzy search and instant search filters for catalog items.',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureSevenDays,
      isOverdue: false,
    },
  });

  const task1_4 = await prisma.task.create({
    data: {
      title: 'Cart & Checkout UI Component Redesign',
      description: 'Figma to React Tailwind CSS conversion.',
      projectId: project1.id,
      assignedToId: dev3.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: pastFiveDays,
      isOverdue: false,
    },
  });

  const task1_5 = await prisma.task.create({
    data: {
      title: 'Performance Audit & Lighthouse Optimization',
      description: 'Target 95+ score on mobile performance metrics.',
      projectId: project1.id,
      assignedToId: dev4.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      dueDate: futureSevenDays,
      isOverdue: false,
    },
  });

  // Project 2 Tasks
  const task2_1 = await prisma.task.create({
    data: {
      title: 'WebSocket Feed Rate-Limiting Engine',
      description: 'Prevent client overload by throttling order book updates to 100ms ticks.',
      projectId: project2.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: pastFiveDays, // OVERDUE
      isOverdue: true,
    },
  });

  const task2_2 = await prisma.task.create({
    data: {
      title: 'Trading Order Matching Engine Unit Tests',
      description: 'Achieve 100% test coverage for limit order execution logic.',
      projectId: project2.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureThreeDays,
      isOverdue: false,
    },
  });

  const task2_3 = await prisma.task.create({
    data: {
      title: 'Financial Charting Library Integration',
      description: 'Integrate Lightweight Charts with real-time candlestick updates.',
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      dueDate: futureSevenDays,
      isOverdue: false,
    },
  });

  const task2_4 = await prisma.task.create({
    data: {
      title: 'OAuth2 Partner API Key Management',
      description: 'Allow institutional partners to generate scoped API keys.',
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: pastThreeDays,
      isOverdue: false,
    },
  });

  const task2_5 = await prisma.task.create({
    data: {
      title: 'Audit Logging & Trade Replay Pipeline',
      description: 'Append-only database log table for regulatory compliance.',
      projectId: project2.id,
      assignedToId: dev1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureSevenDays,
      isOverdue: false,
    },
  });

  // Project 3 Tasks
  const task3_1 = await prisma.task.create({
    data: {
      title: 'HIPAA Encrypted Document Storage',
      description: 'AWS S3 client-side KMS encryption for medical lab reports.',
      projectId: project3.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: futureThreeDays,
      isOverdue: false,
    },
  });

  const task3_2 = await prisma.task.create({
    data: {
      title: 'Video Consultation WebRTC Signaling Server',
      description: 'Establish peer-to-peer video connections between doctor and patient.',
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      dueDate: futureSevenDays,
      isOverdue: false,
    },
  });

  const task3_3 = await prisma.task.create({
    data: {
      title: 'Prescription Automated Renewal Workflow',
      description: 'Push notifications and SMS reminders for medication renewals.',
      projectId: project3.id,
      assignedToId: dev2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: pastFiveDays,
      isOverdue: false,
    },
  });

  const task3_4 = await prisma.task.create({
    data: {
      title: 'Patient Appointment Scheduling Calendar UI',
      description: 'Interactive time slot selector with timezone synchronization.',
      projectId: project3.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureThreeDays,
      isOverdue: false,
    },
  });

  const task3_5 = await prisma.task.create({
    data: {
      title: 'Insurance Policy Verification Middleware',
      description: 'Third-party API verification for active health insurance coverage.',
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      dueDate: futureSevenDays,
      isOverdue: false,
    },
  });

  console.log('✅ Created 15 tasks across 3 projects (2 marked overdue)');

  // 5. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        projectId: project1.id,
        taskId: task1_1.id,
        userId: dev1.id,
        action: 'STATUS_UPDATE',
        oldStatus: 'IN_PROGRESS',
        newStatus: 'IN_REVIEW',
        message: 'Ravi Kumar moved Task #1 (Implement Auth) from In Progress → In Review',
        createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
      },
      {
        projectId: project1.id,
        taskId: task1_2.id,
        userId: dev2.id,
        action: 'STATUS_UPDATE',
        oldStatus: 'TO_DO',
        newStatus: 'IN_PROGRESS',
        message: 'Alex Mercer moved Task #2 (Stripe Payment Gateway) from To Do → In Progress',
        createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
      },
      {
        projectId: project2.id,
        taskId: task2_1.id,
        userId: pm1.id,
        action: 'TASK_CREATED',
        oldStatus: null,
        newStatus: 'TO_DO',
        message: 'Sarah Connor created Task #6 (WebSocket Feed Rate-Limiting Engine) and assigned to Ravi Kumar',
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000), // 2 hrs ago
      },
      {
        projectId: project2.id,
        taskId: task2_2.id,
        userId: dev2.id,
        action: 'STATUS_UPDATE',
        oldStatus: 'IN_PROGRESS',
        newStatus: 'IN_REVIEW',
        message: 'Alex Mercer moved Task #7 (Order Matching Engine Tests) from In Progress → In Review',
        createdAt: new Date(now.getTime() - 3 * 3600 * 1000), // 3 hrs ago
      },
      {
        projectId: project3.id,
        taskId: task3_4.id,
        userId: dev3.id,
        action: 'STATUS_UPDATE',
        oldStatus: 'IN_PROGRESS',
        newStatus: 'IN_REVIEW',
        message: 'Elena Rostova moved Task #14 (Patient Appointment Scheduling Calendar) from In Progress → In Review',
        createdAt: new Date(now.getTime() - 4 * 3600 * 1000), // 4 hrs ago
      },
    ],
  });

  console.log('✅ Seeded pre-existing activity logs');

  // 6. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        title: 'New Task Assignment',
        message: 'You have been assigned to task: Implement Auth & Refresh Cookie Tokens',
        link: `/projects/${project1.id}`,
        read: false,
        createdAt: new Date(now.getTime() - 1 * 3600 * 1000),
      },
      {
        userId: pm1.id,
        title: 'Task Moved to In Review',
        message: 'Ravi Kumar moved task "Implement Auth" to In Review',
        link: `/projects/${project1.id}`,
        read: false,
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      },
      {
        userId: pm2.id,
        title: 'Task Moved to In Review',
        message: 'Elena Rostova moved task "Patient Appointment Scheduling Calendar" to In Review',
        link: `/projects/${project3.id}`,
        read: false,
        createdAt: new Date(now.getTime() - 4 * 3600 * 1000),
      },
    ],
  });

  console.log('✅ Seeded initial user notifications');
  console.log('🚀 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
