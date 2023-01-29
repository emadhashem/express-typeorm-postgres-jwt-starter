import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError ,z } from "zod";


export const validate = (schema : AnyZodObject) => (req : Request , res : Response , next : NextFunction) => {
    try {
        schema.parse({
            body : req.body,
            params : req.params,
            query : req.query
        })
        next()
    } catch (error) {
        if(error instanceof ZodError) {
            return res.status(400)
            .json({
                errors : error.errors,
                status : 'fail'
            })
        }
        next(error)
    }
}