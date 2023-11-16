import { NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

export class JWTMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        console.log(req.headers)
        next()
    }
}

// export function JwtMiddleware(req: Request, res: Response, next: NextFunction) {
//     console.log(req.headers)
//     next()
// }
