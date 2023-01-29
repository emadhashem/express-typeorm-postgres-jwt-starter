import { CookieOptions, json, NextFunction, Request, Response } from "express";
import config from 'config'
import { CreateUserInputType, LoginUserInputType } from "../schemas/user.schema";
import { createUser, findUserByEmail, signTokens } from "../services/user.service";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { signJwt, verifyJwt } from "../utils/jwts";
import redisClient from "../utils/connectRedis";
const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax'
}

if (process.env.NODE_ENV === 'production') {
    cookiesOptions.secure = true
}

const accessTokenCookiesOption: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.get<number>('accessTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('accessTokenExpiresIn') * 60 * 1000
}
const refreshTokenCookiesOption: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.get<number>('refreshTokenExpiresIn') * 60 * 1000
    ),
    maxAge: config.get<number>('refreshTokenExpiresIn') * 60 * 1000
}

export const registerUserHandler = async (
    req: Request<{}, {}, CreateUserInputType>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body
        const newUser = await createUser({
            name, email: email.toLowerCase(), password
        })
        res.status(201)
            .json({
                status: 'succes',
                data: {
                    newUser
                }
            })
    } catch (err: any) {
        // means SQLSTATE  a unique value constraint is violated in Content Manager repository
        if (err.code === 23505) {
            return res.status(409).json({
                status: 'fail',
                message: 'this email already in use'
            })
        }
        next(err)
    }
}

export const loginUserHandler = async (
    req: Request<{}, {}, LoginUserInputType>, res: Response, next: NextFunction
) => {
    try {
        const { email, password } = req.body
        const user = await findUserByEmail({ email })
        if (!user || !(await User.comparePasswords(password, user.password))) {
            return next(new AppError(400, 'email or password not valid'))
        }
        const { access_token, refresh_token } = signTokens(user)
        res.cookie('access_token', access_token, accessTokenCookiesOption)
        res.cookie('refresh_token', refresh_token, refreshTokenCookiesOption)
        res.cookie('logged_in', true, {
            ...accessTokenCookiesOption,
            httpOnly: false
        })
        res.status(200).json({
            status: 'success',
            access_token
        })
    } catch (error) {
        next(error)
    }
}

export const refreshAccessTokenHandler = async (
    req: Request, res: Response, next: NextFunction
) => {
    try {
        const message = 'Could\'nt refresh the session'
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) {
            return next(new AppError(403, message))
        }

        const decode = verifyJwt<{ sub: string }>(refresh_token, 'accessTokenPrivateKey')
        if (!decode) return next(new AppError(403, message))

        const session = await redisClient.get(decode.sub)
        if (!session) {
            return next(new AppError(403, message))
        }

        const user = JSON.parse(session)
        const newAccess_token = signJwt({ sub: user.id }, "accessTokenPrivateKey", {
            expiresIn: `${config.get<number>('accessTokenExpiresIn')}m`
        })
        res.cookie('access_token', newAccess_token, accessTokenCookiesOption)
        res.cookie('logged_in', true, {
            ...cookiesOptions,
            httpOnly: false
        })
        res.status(200).json({
            status: 'success',
            access_token: newAccess_token
        })
    } catch (error) {
        next(error)
    }
}

const logoutFromCookies = async (res: Response) => {
    res.cookie('access_token', '', { maxAge: -1 })
    res.cookie('refresh_token', '', { maxAge: -1 })
    res.cookie('logged_in', '', { maxAge: -1 })
}
export const logoutHandler = async (
    req: Request, res: Response, next: NextFunction
) => {
    try {
        const user = res.locals.user
        await redisClient.del(user.id)
        logoutFromCookies(res)
        res.status(200).json({
            status : 'success',
        })
    } catch (error) {
        next(error)
    }
}

