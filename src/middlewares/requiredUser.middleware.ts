import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";

export const requiredUser =async (
    req : Request , res : Response , next : NextFunction
) => {
    try {
        const user = res.locals.user
        if(!user) {
            return next(new AppError(400 , 'session has expired or user not found'))
        }
        next()
    } catch (error) {
        next(error)
    }
}