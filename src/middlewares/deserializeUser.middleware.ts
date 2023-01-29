import { NextFunction, Request, Response } from "express";
import { findUserByEmail, findUserById } from "../services/user.service";
import AppError from "../utils/appError";
import redisClient from "../utils/connectRedis";
import { verifyJwt } from "../utils/jwts";
import jwt from 'jsonwebtoken'
import config from 'config'
export const deserializeUser = async (
    req : Request , res : Response , next : NextFunction
) => {
    try {
        
        let access_token = null;
        if(req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer')) {
            access_token = req.headers['authorization'].split(' ')[1]
        } else if(req.cookies.access_token) {
            access_token = req.cookies.access_token
        }
        if(!access_token) {
            return next(new AppError(401 , 'You are not logged in'))
        }   
        const decoded = verifyJwt<{sub : string}>(access_token , "accessTokenPrivateKey")
        if(!decoded) return next(new AppError(401 , 'Not authorized'))
        console.log(access_token)
        const session = await redisClient.get(decoded.sub)
        if(!session) return next(new AppError(401 , 'Not authorized'))
        const user = await findUserById(JSON.parse(session).id)
        if(!user) return next(new AppError(401 , 'Not authorized'))
        res.status(200).json({
            status : 'success',
            data : {
                user
            }
        })  
    } catch (error) {
        next(error)
    }
}