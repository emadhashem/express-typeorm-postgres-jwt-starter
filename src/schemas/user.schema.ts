import { z, TypeOf } from 'zod'

export const createUserShcema = z.object({
    body : z.object({
        name : z.string().min(3),
        password : z.string().min(3),
        email : z.string().email(),  
    })
})

export const loginUserSchema = z.object({
    body : z.object({
        email : z.string().email(),
        password : z.string().min(3)
    })
})

export type CreateUserInputType = TypeOf<typeof createUserShcema>['body']
export type LoginUserInputType = TypeOf <typeof loginUserSchema>['body']
