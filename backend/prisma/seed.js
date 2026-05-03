const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskmanager.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskmanager.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Create a sample member
  const memberPassword = await bcrypt.hash('Member@123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@taskmanager.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'member@taskmanager.com',
      password: memberPassword,
      role: 'MEMBER',
    },
  });

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design and improved UX.',
      createdById: admin.id,
    },
  });

  // Add both users as project members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id, role: 'ADMIN' },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member.id } },
    update: {},
    create: { projectId: project.id, userId: member.id, role: 'MEMBER' },
  });

  // Create sample tasks
  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Design new homepage mockup',
        description: 'Create wireframes and high-fidelity mockups for the new homepage design.',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        assignedToId: member.id,
        createdById: admin.id,
        dueDate: new Date('2025-02-01'),
      },
      {
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        assignedToId: admin.id,
        createdById: admin.id,
        dueDate: new Date('2025-02-15'),
      },
      {
        title: 'Write unit tests for API endpoints',
        description: 'Achieve at least 80% code coverage for all REST API endpoints.',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        assignedToId: member.id,
        createdById: admin.id,
        dueDate: new Date('2025-03-01'),
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   Admin: admin@taskmanager.com / Admin@123`);
  console.log(`   Member: member@taskmanager.com / Member@123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
