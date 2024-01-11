import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { AuthUser } from 'src/auth/auth-user.decorator'
import { Role } from 'src/auth/role.decorator'
import { User, UserRole } from 'src/users/entities/user.entity'
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto'
import { Restaurant } from './entities/restaurant.entity'
import { RestaurantService } from './restaurants.service'
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto'
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto'
import { AllCategoriesOutput } from './dtos/all-categories.dto'
import { Category } from './entities/category.entity'
import { CategoryInput, CategoryOutput } from './dtos/category.dto'

@Resolver((of) => Restaurant)
export class RestaurantResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    @Mutation((returns) => CreateRestaurantOutput)
    @Role([UserRole.Owner])
    async createRestaurant(
        @AuthUser() authUser: User,
        @Args('input') createRestaurantInput: CreateRestaurantInput,
    ): Promise<CreateRestaurantOutput> {
        return this.restaurantService.createRestaurant(authUser, createRestaurantInput)
    }

    @Mutation((returns) => EditRestaurantOutput)
    @Role(['Owner'])
    editRestaurant(
        @AuthUser() owner: User,
        @Args('input') editRestaurantInput: EditRestaurantInput,
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.editRestaurant(owner, editRestaurantInput)
    }

    @Mutation((returns) => DeleteRestaurantOutput)
    @Role(['Owner'])
    deleteRestaurant(
        @AuthUser() owner: User,
        @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
    ): Promise<DeleteRestaurantOutput> {
        return this.restaurantService.deleteRestaurant(owner, deleteRestaurantInput)
    }
}

@Resolver((of) => Category)
export class CategoryResolver {
    constructor(private readonly restaurantService: RestaurantService) {}

    //매 request마다 계산된 field값을 가져온다. (DB에는 존재하지 않고 GraphQL 스키마에만 존재)
    @ResolveField((type) => Int)
    restaurantCount(@Parent() category: Category): Promise<number> {
        return this.restaurantService.countRestaurants(category)
    }

    @Query((type) => AllCategoriesOutput)
    allCategories(): Promise<AllCategoriesOutput> {
        return this.restaurantService.allCategories()
    }

    @Query((type) => CategoryOutput)
    category(@Args() categoryInput: CategoryInput): Promise<CategoryOutput> {
        return this.restaurantService.findCategoryBySlug(categoryInput)
    }
}
