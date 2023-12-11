import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { JwtService } from 'src/jwt/jwt.service'
import { MailService } from 'src/mail/mail.service'
import { User } from './entities/user.entity'
import { Verification } from './entities/verification.entity'
import { UserService } from './users.service'
import { Repository } from 'typeorm'

const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
})

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
    let verificationsRepository: MockRepository<Verification>
    let mailService: MailService
    let jwtService: JwtService

    // beforeAll은 테스트 한 것이 Jest메모리에 남아있어, toHaveBeenCalledTimes 등에 영향을 줄 수 있다.
    // each를 사용하면, 각각의 테스트가 끝날 때마다, 모든 것을 초기화한다.
    //beforeAll(async () => {
    beforeEach(async () => {
        // 모듈을 만들고, 테스트할 서비스를 가져온다.
        const module = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository(),
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository(),
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
        mailService = module.get<MailService>(MailService)
        jwtService = module.get<JwtService>(JwtService)
        usersRepository = module.get(getRepositoryToken(User))
        verificationsRepository = module.get(getRepositoryToken(Verification))
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('createAccount', () => {
        const createAccountArgs = {
            email: 'bs@email.com',
            password: 'bs.password',
            role: 0,
        }
        it('should fail if user exists', async () => {
            // findOne에 대한 mockResolvedValue를 설정한다.
            usersRepository.findOne.mockResolvedValue({
                id: 1,
                email: '',
            })
            const result = await service.createAccount({
                email: '',
                password: '',
                role: 0,
            })
            expect(result).toMatchObject({
                ok: false,
                error: 'There is a user with that email already',
            })
        })
        it('should create a new user', async () => {
            // findOne에 대한 mockResolvedValue를 설정한다(=undefined)
            usersRepository.findOne.mockResolvedValue(undefined)
            usersRepository.create.mockReturnValue(createAccountArgs)
            usersRepository.save.mockResolvedValue(createAccountArgs)
            verificationsRepository.create.mockReturnValue({
                user: createAccountArgs,
            })
            verificationsRepository.save.mockResolvedValue({
                code: 'code',
            })

            const result = await service.createAccount(createAccountArgs)

            expect(usersRepository.create).toHaveBeenCalledTimes(1)
            expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs)

            expect(usersRepository.save).toHaveBeenCalledTimes(1)
            expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs)

            expect(verificationsRepository.create).toHaveBeenCalledTimes(1)
            expect(verificationsRepository.create).toHaveBeenCalledWith({
                user: createAccountArgs,
            })

            expect(verificationsRepository.save).toHaveBeenCalledTimes(1)
            expect(verificationsRepository.save).toHaveBeenCalledWith({
                user: createAccountArgs,
            })

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1)
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(expect.any(String), expect.any(String))
            expect(result).toEqual({ ok: true })
        })

        // 어떤 exception이 발생했다면, fail 처리 되어야 한다.
        it('should fail on exception', async () => {
            // findOne에 대한 mockResolvedValue를 설정한다(Error)
            usersRepository.findOne.mockRejectedValue(new Error())
            const result = await service.createAccount(createAccountArgs)
            expect(result).toEqual({ ok: false, error: "Couldn't create account" })
        })
    })

    // 테스트할 함수명을 작성

    describe('login', () => {
        const loginArgs = {
            email: 'bs@email.com',
            password: 'bs.password',
        }
        it('should fail if user does not exist', async () => {
            usersRepository.findOne.mockResolvedValue(null)

            const result = await service.login(loginArgs)

            expect(usersRepository.findOne).toHaveBeenCalledTimes(1)
            expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
            expect(result).toEqual({
                ok: false,
                error: 'User not found',
            })
        })

        it('should fail if the password is wrong', async () => {
            const mockedUser = {
                // Promise.resolve를 사용하면, 비동기 함수를 사용할 수 있다.
                checkPassword: jest.fn(() => Promise.resolve(false)),
            }
            usersRepository.findOne.mockResolvedValue(mockedUser)
            const result = await service.login(loginArgs)
            expect(result).toEqual({ ok: false, error: 'Wrong password' })
        })

        it('should return token if password correct', async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(true)),
            }
            usersRepository.findOne.mockResolvedValue(mockedUser)
            const result = await service.login(loginArgs)
            console.log(result)
            expect(jwtService.sign).toHaveBeenCalledTimes(1)
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number))
            expect(result).toEqual({ ok: true, token: 'signed-token-baby' })
        })
    })
    it.todo('findById')
    it.todo('editProfile')
    it.todo('verifyEmail')
})
