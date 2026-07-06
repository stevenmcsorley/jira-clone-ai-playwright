import { Controller, Get } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'

/** Monitoring self-test: deliberately throws so Skylark captures a test error.
 *  Public so it can be triggered with a simple GET. */
@Controller('api/skylark')
export class SkylarkTestController {
  @Public()
  @Get('test-error')
  testError(): never {
    throw new Error('Skylark test error from Ossicone — backend monitoring is working')
  }
}
