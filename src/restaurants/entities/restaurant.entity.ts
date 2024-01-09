import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { IsString, Length } from 'class-validator'
import { CoreEntity } from 'src/common/entities/core.entity'
import { User } from 'src/users/entities/user.entity'
import { Column, Entity, ManyToOne, RelationId } from 'typeorm'
import { Category } from './category.entity'

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
    @Field((type) => String)
    @Column()
    @IsString()
    @Length(5)
    name: string

    @Field((type) => String)
    @Column()
    @IsString()
    coverImg: string

    @Field((type) => String)
    @Column()
    @IsString()
    address: string

    @Field((type) => Category, { nullable: true })
    @ManyToOne((type) => Category, (category) => category.restaurants, { nullable: true, onDelete: 'SET NULL' })
    category: Category

    @Field((type) => User)
    @ManyToOne((type) => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
    owner: User

    // RelationId 데코레이터는 DB에는 존재하지 않지만, Restaurant Entity에는 존재하는 ownerId를 가져올 수 있게 해준다.
    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number
}
