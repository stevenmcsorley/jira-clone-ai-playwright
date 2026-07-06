import { ArgumentsHost, Catch, HttpException } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { reportToSkylark } from './skylark.reporter'

/**
 * Global filter that reports unhandled server (5xx) errors to Skylark, then
 * delegates to Nest's default handling. Best-effort and non-blocking.
 */
@Catch()
export class SkylarkExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException ? exception.getStatus() : 500
    if (status >= 500) {
      let path: string | undefined
      try {
        path = host.switchToHttp().getRequest()?.url
      } catch {
        /* ignore */
      }
      reportToSkylark(exception, { tags: ['backend'], extra: path ? { path } : undefined })
    }
    super.catch(exception, host)
  }
}
