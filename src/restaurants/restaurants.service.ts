import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/entities/user.entity'
import { ILike, Like, Raw, Repository } from 'typeorm'
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto'

import { Restaurant } from './entities/restaurant.entity'
import { Category } from './entities/category.entity'
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto'
import { CategoryRepository } from './repositories/category.repository'
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto'
import { AllCategoriesOutput } from './dtos/all-categories.dto'
import { CategoryInput, CategoryOutput } from './dtos/category.dto'
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto'
import { SearchRestaurantInput, SearchRestaurantOutput } from './dtos/search-restaurant.dto'
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto'
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto'
import { Dish } from './entities/dish.entity'

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
        private readonly categories: CategoryRepository,
    ) {}

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
        } catch (error) {
            return {
                ok: false,
                error: 'Could not create restaurant',
            }
        }
    }

    async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({
                where: { id: editRestaurantInput.restaurantId },
                relations: ['menu'],
            })
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

    async deleteRestaurant(owner: User, { restaurantId }: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } })
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                }
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't delete a restaurant that you don't own",
                }
            }
            await this.restaurants.delete(restaurantId)
            return {
                ok: true,
            }
        } catch {
            return {
                ok: false,
                error: 'Could not delete restaurant.',
            }
        }
    }

    async allCategories(): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categories.find()
            return {
                ok: true,
                categories,
            }
        } catch {
            return {
                ok: false,
                error: 'Could not load categories',
            }
        }
    }

    countRestaurants(category: Category) {
        return this.restaurants.count({
            where: {
                category: {
                    id: category.id,
                },
            },
        })
    }

    async findCategoryBySlug({ slug, page }: CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categories.findOne({
                where: { slug },
            })
            const restaurants = await this.restaurants.find({
                where: {
                    category: {
                        id: category.id,
                    },
                },
                take: 25,
                skip: (page - 1) * 25,
            })
            const totalResults = await this.countRestaurants(category)
            if (!category) {
                return {
                    ok: false,
                    error: 'Category not found',
                }
            }
            return {
                ok: true,
                restaurants,
                category,
                totalPages: Math.ceil(totalResults / 25),
            }
        } catch {
            return {
                ok: false,
                error: 'Could not load category',
            }
        }
    }
    async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurants.findAndCount({
                skip: (page - 1) * 25,
                take: 25,
            })
            return {
                ok: true,
                results: restaurants,
                totalPages: Math.ceil(totalResults / 25),
                totalResults,
            }
        } catch {
            return {
                ok: false,
                error: 'Could not load restaurants',
            }
        }
    }

    async findRestaurantById({ restaurantId }: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } })
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                }
            }
            return {
                ok: true,
                restaurant,
            }
        } catch {
            return {
                ok: false,
                error: 'Could not find restaurant',
            }
        }
    }

    async searchRestaurantByName({ query, page }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurants.findAndCount({
                where: {
                    name: ILike(`%${query}%`),
                },
                skip: (page - 1) * 25,
                take: 25,
            })
            return {
                ok: true,
                restaurants,
                totalResults,
                totalPages: Math.ceil(totalResults / 25),
            }
        } catch {
            return { ok: false, error: 'Could not search for restaurants' }
        }
    }

    async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput> {
        try {
            const restaurant = await this.restaurants.findOne({ where: { id: createDishInput.restaurantId } })
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                }
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't do that.",
                }
            }
            await this.dishes.save(this.dishes.create({ ...createDishInput, restaurant }))
            return {
                ok: true,
            }
        } catch (error) {
            console.log(error)
            return {
                ok: false,
                error: 'Could not create dish',
            }
        }
    }
}
