import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from './entities/order.entity'
import { Restaurant } from 'src/restaurants/entities/restaurant.entity'
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto'
import { User } from 'src/users/entities/user.entity'
import { OrderItem } from './entities/order-item.entity'
import { Dish } from 'src/restaurants/entities/dish.entity'

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItems: Repository<OrderItem>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
    ) {}

    async crateOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
        const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } })
        if (!restaurant) {
            return {
                ok: false,
                error: 'Restaurant not found',
            }
        }
        items.forEach(async (item) => {
            const dish = await this.dishes.findOne({ where: { id: item.dishId } })
            if (!dish) {
                // abort this whole thing
            }
            await this.orderItems.save(
                this.orderItems.create({
                    dish,
                    options: item.options,
                }),
            )
        })
        /* const order = await this.orders.save(
            this.orders.create({
                customer,
                restaurant,
            }),
        )
        console.log(order); */
    }
}
