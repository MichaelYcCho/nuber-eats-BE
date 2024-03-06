import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql'
import { AuthUser } from 'src/auth/auth-user.decorator'
import { Role } from 'src/auth/role.decorator'
import { User } from 'src/users/entities/user.entity'

import { Order } from './entities/order.entity'
import { OrderService } from './orders.service'
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto'
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto'
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto'
import { PubSub } from 'graphql-subscriptions'
import { Inject } from '@nestjs/common'
import { NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants'
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto'

@Resolver((of) => Order)
export class OrderResolver {
    constructor(
        private readonly ordersService: OrderService,
        @Inject(PUB_SUB) private readonly pubSub: PubSub,
    ) {}

    @Mutation((returns) => CreateOrderOutput)
    @Role(['Client'])
    async createOrder(
        @AuthUser() customer: User,
        @Args('input') createOrderInput: CreateOrderInput,
    ): Promise<CreateOrderOutput> {
        return this.ordersService.crateOrder(customer, createOrderInput)
    }

    @Query((returns) => GetOrdersOutput)
    @Role(['Any'])
    async getOrders(@AuthUser() user: User, @Args('input') getOrdersInput: GetOrdersInput): Promise<GetOrdersOutput> {
        return this.ordersService.getOrders(user, getOrdersInput)
    }

    @Query((returns) => GetOrderOutput)
    @Role(['Any'])
    async getOrder(@AuthUser() user: User, @Args('input') getOrderInput: GetOrderInput): Promise<GetOrderOutput> {
        return this.ordersService.getOrder(user, getOrderInput)
    }

    @Mutation((returns) => EditOrderOutput)
    @Role(['Any'])
    async editOrder(@AuthUser() user: User, @Args('input') editOrderInput: EditOrderInput): Promise<EditOrderOutput> {
        return this.ordersService.editOrder(user, editOrderInput)
    }

    @Mutation((returns) => Boolean)
    async connectionReady(@Args('connectId') connectId: number) {
        await this.pubSub.publish('ExampleSubscription', {
            subscriptionsExample: connectId,
        })
        return true
    }

    @Subscription((returns) => Order, {
        filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
            return ownerId === user.id;
        },
        resolve: ({ pendingOrders: { order } }) => order,
    })
    @Role(['Owner'])
    pendingOrders() {
        return this.pubSub.asyncIterator(NEW_PENDING_ORDER)
    }
}
