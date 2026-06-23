import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
export const createLead = async (req: AuthRequest, res: Response) => {
    const {name, company, email, phone, status} = req.body;
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    const lead = await prisma.lead.create({
        data: {name, company, email, phone, status, userId,},
    });
    return res.status(201).json({
        success: true,
        message: "Lead created successfully",
        lead,
    });
};
