import jwt, { SignOptions } from 'jsonwebtoken'
import  config  from 'config'

export const signJwt = (
    payload: Object,
    keyName: 'accessTokenPrivateKey',
    options: SignOptions
) => {
    const privateKey = config.get<string>(keyName)
    return jwt.sign(payload , privateKey , options)
}

export const verifyJwt = <T>(token : string , 
    keyName: 'accessTokenPrivateKey'
    ) : T | null => {
    try {
        const publicKey = config.get<string>(keyName) 
        const decode = jwt.verify(token , publicKey) as T
        
        return decode
    } catch (error) {
        return null
    }
}