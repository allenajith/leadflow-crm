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
    try {
        const existingLead = await prisma.lead.findUnique({
            where: { email },
        });

        if (existingLead) {
            return res.status(409).json({
                success: false,
                message: "A lead with this email already exists",
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
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                success: false,
                message: "A lead with this email already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create lead",
        });
    }
};
export const getLeads = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const leads = await prisma.lead.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            leads,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch leads",
        });
    }
};

export const getLeadById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const lead = await prisma.lead.findFirst({
            where: {
                id: Number(id),
                userId,
            },
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            lead,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "failed to fetch lead",
        });
    }
};
export const updateLead = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, company, email, phone, status } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const existingLead = await prisma.lead.findFirst({
            where: {
                id: Number(id),
                userId,
            },
        });

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        const updatedLead = await prisma.lead.update({
            where: {
                id: Number(id),
            },
            data: {
                name,
                company,
                email,
                phone,
                status,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            lead: updatedLead,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update lead",
        });
    }
};

export const deleteLead = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const existingLead = await prisma.lead.findFirst({
            where: {
                id: Number(id),
                userId,
            },
        });

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        await prisma.lead.delete({
            where: {
                id: Number(id),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Lead deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete lead",
        });
    }
};