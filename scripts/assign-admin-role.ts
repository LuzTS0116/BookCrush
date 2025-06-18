#!/usr/bin/env tsx
/**
 * Script to assign admin roles to users
 * Usage: npx tsx scripts/assign-admin-role.ts <email> <role>
 * Example: npx tsx scripts/assign-admin-role.ts admin@example.com ADMIN
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

async function assignRole(email: string, role: UserRole) {
  try {
    console.log(`Assigning role ${role} to user with email: ${email}`);

    // Find user by email
    const user = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, display_name: true, email: true, role: true }
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.display_name} (${user.email}) - Current role: ${user.role}`);

    // Update user role
    const updatedUser = await prisma.profile.update({
      where: { email },
      data: { role },
      select: { id: true, display_name: true, email: true, role: true }
    });

    console.log(`✅ Successfully updated user role to ${role}`);
    console.log(`User: ${updatedUser.display_name} (${updatedUser.email}) - New role: ${updatedUser.role}`);

  } catch (error) {
    console.error('Error assigning role:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function listAdmins() {
  try {
    console.log('Current admin users:');
    
    const admins = await prisma.profile.findMany({
      where: {
        role: {
          in: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        role: true,
        created_at: true
      },
      orderBy: { role: 'desc' }
    });

    if (admins.length === 0) {
      console.log('No admin users found');
      return;
    }

    admins.forEach(admin => {
      console.log(`- ${admin.display_name} (${admin.email}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('Error listing admins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--list') {
    await listAdmins();
    return;
  }

  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/assign-admin-role.ts <email> <role>');
    console.log('Roles: USER, MODERATOR, ADMIN, SUPER_ADMIN');
    console.log('Example: npx tsx scripts/assign-admin-role.ts admin@example.com ADMIN');
    console.log('List admins: npx tsx scripts/assign-admin-role.ts --list');
    process.exit(1);
  }

  const [email, role] = args;
  const validRoles: UserRole[] = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

  if (!validRoles.includes(role as UserRole)) {
    console.error(`Invalid role: ${role}`);
    console.error(`Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  await assignRole(email, role as UserRole);
}

main().catch(console.error); 