import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './entities/order.entity'
import { OrderService } from './orders.service'
import { OrderResolver } from './orders.resolver'
import { Restaurant } from 'src/restaurants/entities/restaurant.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Order, Restaurant])],
    providers: [OrderService, OrderResolver],
})
export class OrdersModule {}
