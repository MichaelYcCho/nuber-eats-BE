import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/entities/user.entity'
import { Repository } from 'typeorm'
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto'

import { Restaurant } from './entities/restaurant.entity'
import { Category } from './entities/category.entity'
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto'
import { CategoryRepository } from './repositories/category.repository'

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(CategoryRepository)
        private readonly categories: CategoryRepository,
    ) {}

    async getOrCreate(name: string): Promise<Category> {
        const categoryName = name.trim().toLowerCase()
        const categorySlug = categoryName.replace(/ /g, '-')
        let category = await this.categories.findOne({ where: { slug: categorySlug } })
        if (!category) {
            category = await this.categories.save(this.categories.create({ slug: categorySlug, name: categoryName }))
        }
        return category
    }

    async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurants.create(createRestaurantInput)
            newRestaurant.owner = owner
            const category = await this.categories.getOrCreate(createRestaurantInput.categoryName)
            newRestaurant.category = category
            await this.restaurants.save(newRestaurant)
            return {
                ok: true,
            }
        } catch {
            return {
                ok: false,
                error: 'Could not create restaurant',
            }
        }
    }

    async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({ where: { id: editRestaurantInput.restaurantId } })
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                }
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't edit a restaurant that you don't own",
                }
            }
            let category: Category = null
            if (editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(editRestaurantInput.categoryName)
            }
            // ...(category && { category })는 category가 존재하면 { category: category }를 리턴하고, 존재하지 않으면 아무것도 리턴하지 않는다.
            await this.restaurants.save([
                {
                    id: editRestaurantInput.restaurantId,
                    ...editRestaurantInput,
                    ...(category && { category }),
                },
            ])

            return {
                ok: true,
            }
        } catch {
            return {
                ok: false,
                error: 'Could not edit Restaurant',
            }
        }
    }
}
