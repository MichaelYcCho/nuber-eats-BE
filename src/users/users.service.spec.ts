import { Test } from '@nestjs/testing'
import { UserService } from './users.service'

describe('UserService', () => {
    let service: UserService

    beforeAll(async () => {
        // 모듈을 만들고, 테스트할 서비스를 가져온다.
        const module = await Test.createTestingModule({
            providers: [UserService],
        }).compile()
        service = module.get<UserService>(UserService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    // 테스트할 함수명을 작성
    it.todo('createAccount')
    it.todo('login')
    it.todo('findById')
    it.todo('editProfile')
    it.todo('verifyEmail')
})
