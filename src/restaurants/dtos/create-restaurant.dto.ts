import { ArgsType, Field, InputType, OmitType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';
import { Restaurant } from '../entities/restaurant.entity';

// id를 제외한 Restaurant의 모든 필드를 가져온다.
@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {}
