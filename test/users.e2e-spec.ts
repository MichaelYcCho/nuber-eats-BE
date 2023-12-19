import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'

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

    it.todo('can createAccount')
    it.todo('userProfile')
    it.todo('login')
    it.todo('me')
    it.todo('verifyEmail')
    it.todo('editProfile')
})
