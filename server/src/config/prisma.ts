import {PrismaClient} from "../../generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg";
console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);
const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!
    })
});
export default prisma;
//now other files can do import prisma