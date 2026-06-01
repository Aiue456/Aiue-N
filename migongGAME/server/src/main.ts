import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['http://localhost:5173'],
    credentials: true,
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(process.env.PORT || 3001)
}
bootstrap()
