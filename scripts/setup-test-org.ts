import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestOrg() {
  try {
    console.log('Setting up test organization...');
    
    // Create or get test organization
    const org = await prisma.organization.upsert({
      where: { slug: 'test-org' },
      update: {},
      create: {
        name: 'Test Organization',
        slug: 'test-org',
        creditsRemaining: 10,
        planType: 'individual',
      },
    });
    
    console.log('✅ Organization created/found:', org.name);
    console.log('📊 Credits remaining:', org.creditsRemaining);
    console.log('🆔 Organization ID:', org.id);
    
    // Find the first user to attach to the organization
    const user = await prisma.user.findFirst();
    
    if (user) {
      // Create or update organization membership
      const membership = await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          organizationId: org.id,
          userId: user.id,
          role: 'owner',
        },
      });
      
      console.log('✅ User added to organization:', user.email);
      console.log('👤 Role:', membership.role);
    } else {
      console.log('⚠️  No users found. Please sign in first, then run this script again.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestOrg();