import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { SkylarkExceptionFilter } from './skylark/skylark-exception.filter'
import { reportToSkylark } from './skylark/skylark.reporter'

// Catch crashes outside the request cycle (background jobs, timers, etc.).
process.on('unhandledRejection', reason =>
  reportToSkylark(reason, { tags: ['backend', 'unhandledRejection'] }),
)
process.on('uncaughtException', err =>
  reportToSkylark(err, { tags: ['backend', 'uncaughtException'] }),
)

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe())
  // Report unhandled 5xx errors to Skylark (no-op unless SKYLARK_URL/TOKEN set).
  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new SkylarkExceptionFilter(httpAdapter))
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`🚀 Backend running on port ${port}`)
}

bootstrap()