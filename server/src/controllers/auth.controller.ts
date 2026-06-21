import { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "register endpoint is working",
  });
};

export const login = async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "login endpoint is working",
    });
};