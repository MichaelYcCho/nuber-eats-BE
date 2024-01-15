import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Restaurant } from './entities/restaurant.entity'
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver'
import { RestaurantService } from './restaurants.service'
import { CategoryRepository } from './repositories/category.repository'
import { Category } from './entities/category.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Category])],
    providers: [RestaurantResolver, CategoryResolver, RestaurantService, CategoryRepository],
})
export class RestaurantsModule {}
