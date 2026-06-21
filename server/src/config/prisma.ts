import {PrismaClient} from "@prisma/client"
const prisma = new PrismaClient();
export default prisma;
//now other files can do import prisma