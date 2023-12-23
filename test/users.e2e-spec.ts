import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { DataSource, Repository } from 'typeorm'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from 'src/users/entities/user.entity'

// got가 실제로 호출되는 것을 방지하기 위해 mock을 사용(여기선 이메일 전송을 막기 위해)
jest.mock('got', () => {
    return {
        post: jest.fn(),
    }
})

const GRAPHQL_ENDPOINT = '/graphql'

const testUser = {
    email: 'michael@las.com',
    password: '12345',
}

describe('UserModule (e2e)', () => {
    let app: INestApplication
    let usersRepository: Repository<User>
    let jwtToken: string

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = module.createNestApplication()
        // getRepositoryToken(User)는 User entity의 repository를 가져온다.
        usersRepository = module.get<Repository<User>>(getRepositoryToken(User))
        await app.init()
    })

    afterAll(async () => {
        const dataSource: DataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        })
        const connection: DataSource = await dataSource.initialize()
        await connection.dropDatabase() // 데이터베이스 삭제
        await connection.destroy() // 연결 해제
        await app.close()
    })

    // 유저 생성 e2e 테스트
    describe('createAccount', () => {
        const EMAIL = 'michael@las.com'
        it('should create account', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        mutation {
                            createAccount(input: {
                            email:"${testUser.email}",
                            password:"${testUser.password}",
                            role:Owner
                            }) {
                            ok
                            error
                            }
                        }
                        `,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.createAccount.ok).toBe(true)
                    expect(res.body.data.createAccount.error).toBe(null)
                })
        })

        it('should fail if account already exists', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        mutation {
                            createAccount(input: {
                            email:"${testUser.email}",
                            password:"${testUser.password}",
                            role:Owner
                            }) {
                            ok
                            error
                            }
                        }
                        `,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.createAccount.ok).toBe(false)
                    expect(res.body.data.createAccount.error).toBe('There is a user with that email already')
                    // 또는 toEqual(expect.any(String))
                })
        })
    })

    // 로그인 e2e 테스트
    describe('login', () => {
        it('should login with correct credentials', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        mutation {
                            login(input:{
                            email:"${testUser.email}",
                            password:"${testUser.password}",
                            }) {
                            ok
                            error
                            token
                            }
                        }
                        `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: { login },
                        },
                    } = res
                    expect(login.ok).toBe(true)
                    expect(login.error).toBe(null)
                    expect(login.token).toEqual(expect.any(String))
                    jwtToken = login.token
                })
        })
        it('should not be able to login with wrong credentials', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        mutation {
                            login(input:{
                            email:"${testUser.email}",
                            password:"xxx",
                            }) {
                            ok
                            error
                            token
                            }
                        }
                        `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: { login },
                        },
                    } = res
                    expect(login.ok).toBe(false)
                    expect(login.error).toBe('Wrong password')
                    expect(login.token).toBe(null)
                })
        })
    })
    describe('userProfile', () => {
        let userId: number
        beforeAll(async () => {
            const [user] = await usersRepository.find()
            userId = user.id
        })
        it("should see a user's profile", () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .set('X-JWT', jwtToken) // 로그인 후 받은 토큰을 헤더에 넣어준다.
                .send({
                    query: `
                            {
                            userProfile(userId:${userId}){
                                ok
                                error
                                user {
                                id
                                }
                            }
                            }
                            `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                userProfile: {
                                    ok,
                                    error,
                                    user: { id },
                                },
                            },
                        },
                    } = res
                    expect(ok).toBe(true)
                    expect(error).toBe(null)
                    expect(id).toBe(userId)
                })
        })
        it('should not find a profile', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .set('X-JWT', jwtToken)
                .send({
                    query: `
                            {
                            userProfile(userId:666){
                                ok
                                error
                                user {
                                id
                                }
                            }
                            }
                            `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                userProfile: { ok, error, user },
                            },
                        },
                    } = res
                    expect(ok).toBe(false)
                    expect(error).toBe('User Not Found')
                    expect(user).toBe(null)
                })
        })
    })
    // me는 로그인한 유저의 정보를 가져오는 쿼리이다.
    describe('me', () => {
        it('should find my profile', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .set('X-JWT', jwtToken)
                .send({
                    query: `
                        {
                            me {
                            email
                            }
                        }
                        `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: {
                            data: {
                                me: { email },
                            },
                        },
                    } = res
                    expect(email).toBe(testUser.email)
                })
        })
        it('should not allow logged out user', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        {
                        me {
                            email
                        }
                        }
                    `,
                })
                .expect(200)
                .expect((res) => {
                    const {
                        body: { errors },
                    } = res
                    const [error] = errors
                    expect(error.message).toBe('Forbidden resource')
                })
        })
    })
    it.todo('verifyEmail')
    it.todo('editProfile')
})
