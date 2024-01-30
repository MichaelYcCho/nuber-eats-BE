import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './entities/order.entity'
import { OrderService } from './orders.service'
import { OrderResolver } from './orders.resolver'
import { Restaurant } from 'src/restaurants/entities/restaurant.entity'
import { Dish } from 'src/restaurants/entities/dish.entity'
import { OrderItem } from './entities/order-item.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Order, Restaurant, OrderItem, Dish])],
    providers: [OrderService, OrderResolver],
})
export class OrdersModule {}
