import { BeforeInsert, Column, Entity, Index } from "typeorm";
import { BaseModel } from "./base.model";
import bycrpt from 'bcryptjs'
@Entity('users')
export class User extends BaseModel {
    @Column()
    name : string

    @Column({
        unique : true
    })
    @Index("email_index")
    email : string
    @Column({
        nullable : true
    })
    photo : string
    @Column()
    password : string

    toJSON() {
        return {...this , password : undefined}
    }

    @BeforeInsert()
    async hashPassword() {
        this.password = await bycrpt.hash(this.password , 12)
    }

    static async comparePasswords(candidatePass : string , hashedPass : string) {
        return await bycrpt.compare(candidatePass , hashedPass);
    }
}
