import { PrismaClient } from '@/lib/generated/prisma'
const prisma = new PrismaClient();
async function main() {
  //change to reference a table in your schema
  const val = await prisma.profile.findMany({
    take: 10,
  });
  console.log(val);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  process.exit(1);
});