import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { JwtService } from 'src/jwt/jwt.service'
import { MailService } from 'src/mail/mail.service'
import { User } from './entities/user.entity'
import { Verification } from './entities/verification.entity'
import { UserService } from './users.service'
import { Repository } from 'typeorm'

const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
}

const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
}

const mockMailService = {
    sendVerificationEmail: jest.fn(),
}

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>

describe('UserService', () => {
    let service: UserService
    let usersRepository: MockRepository<User>

    beforeAll(async () => {
        // 모듈을 만들고, 테스트할 서비스를 가져온다.
        const module = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
            ],
        }).compile()
        service = module.get<UserService>(UserService)
        usersRepository = module.get(getRepositoryToken(User))
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('createAccount', () => {
        it('should fail if user exists', () => {})
    })

    // 테스트할 함수명을 작성
    it.todo('createAccount')
    it.todo('login')
    it.todo('findById')
    it.todo('editProfile')
    it.todo('verifyEmail')
})
