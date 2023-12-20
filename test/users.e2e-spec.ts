import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'

// got가 실제로 호출되는 것을 방지하기 위해 mock을 사용(여기선 이메일 전송을 막기 위해)
jest.mock('got', () => {
    return {
        post: jest.fn(),
    }
})

const GRAPHQL_ENDPOINT = '/graphql'

describe('UserModule (e2e)', () => {
    let app: INestApplication

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = module.createNestApplication()
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

    describe('createAccount', () => {
        const EMAIL = 'michael@las.com'
        it('should create account', () => {
            return request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: `
                        mutation {
                            createAccount(input: {
                            email:"${EMAIL}",
                            password:"12345",
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
                            email:"${EMAIL}",
                            password:"12345",
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
    it.todo('userProfile')
    it.todo('login')
    it.todo('me')
    it.todo('verifyEmail')
    it.todo('editProfile')
})
