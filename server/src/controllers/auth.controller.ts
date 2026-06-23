import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const register = async (req: Request, res: Response) => {
    console.log("BODY: ", req.body);
    try{
        const {name, email, password} = req.body;
        if (!name||!email||!password) {
            return res.status(400).json({
                success: true,
                message: "all fields are required",
            });
        }
        console.log("Checking existing user...");
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        console.log("findUnique result:", existingUser);
        if (existingUser) {
                return res.status(400).json({
                success: false,
                message: "user already exists",
            });
        }
        console.log("Creating user...");
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await prisma.user.create({
            data: {
                name, email, password: hashedPassword,
            },
        });
        return res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }catch(error){
        console.log("REGISTER ERROR:")
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "internal server error",
        });
    }
}

export const login = async (req: Request, res: Response) => {
    try{
        const {email, password} = req.body;
        if (!email||!password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required",
            });
        }
        const user = await prisma.user.findUnique({where: {email},});
        if (!user) {
            return res.status(401).json({success: false, message: "invalid credentials",});
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({success: false,
                message: "Invalid credentials",});
        }
        console.log("JWT_SECRET:", process.env.JWT_SECRET);
        const token = jwt.sign({ userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" });

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({success: false, message: "internal server error"});
    }
};

export const getProfile = async(req: AuthRequest, res: Response, next: NextFunction) => {return res.status(200).json({success: true, message: "accessed the protected route", userId: req.userId,});};