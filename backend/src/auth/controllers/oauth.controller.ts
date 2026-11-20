import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Query, Req, Res, ForbiddenException } from '@nestjs/common'
import type { Response } from 'express'
import { OAuthService, oauthResource, oauthSite } from '../services/oauth.service'
import { Public } from '../decorators/public.decorator'
import { rateLimit } from '../rate-limit'

@Controller()
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}
  @Public()
  @Get(['.well-known/oauth-protected-resource', '.well-known/oauth-protected-resource/mcp'])
  resource() {
    return { resource: oauthResource(), authorization_servers: [oauthSite()], scopes_supported: ['mcp'], bearer_methods_supported: ['header'] }
  }
  @Public()
  @Get('.well-known/oauth-authorization-server')
  metadata() {
    return { issuer: oauthSite(), authorization_endpoint: `${oauthSite()}/oauth/authorize`,
      token_endpoint: `${oauthSite()}/oauth/token`, registration_endpoint: `${oauthSite()}/oauth/register`,
      response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'], code_challenge_methods_supported: ['S256'],
      scopes_supported: ['mcp', 'offline_access'], authorization_response_iss_parameter_supported: true }
  }
  @Public()
  @Post('oauth/register')
  @Header('Cache-Control', 'no-store')
  register(@Body() body: any, @Req() req: any) {
    rateLimit('oauth-register', req.ip, 30, 3600000)
    return this.oauth.register(body)
  }
  @Public()
  @Get('oauth/authorize')
  @Header('Cache-Control', 'no-store')
  async authorize(@Query() query: any, @Req() req: any, @Res() res: Response) {
    rateLimit('oauth-authorize', req.ip, 60)
    res.redirect(await this.oauth.authorize(query))
  }
  @Public()
  @Post('oauth/token')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  token(@Body() body: any, @Req() req: any) {
    rateLimit('oauth-token', req.ip, 120)
    return this.oauth.token(body)
  }
  private browserSession(req: any) {
    if (req.apiToken || req.oauthIdentity || (req.headers.origin && req.headers.origin !== oauthSite()))
      throw new ForbiddenException('Use your Ossicone browser login')
    return req.headers.authorization
  }
  @Get('api/oauth/request')
  @Header('Cache-Control', 'no-store')
  request(@Query('request') request: string, @Req() req: any) {
    return this.oauth.request(request, this.browserSession(req))
  }
  @Post('api/oauth/consent')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  consent(@Body() body: any, @Req() req: any) {
    return this.oauth.consent(body, req.user.id, this.browserSession(req))
  }
  @Get('api/oauth/connections')
  connections(@Req() req: any) {
    this.browserSession(req)
    return this.oauth.connections(req.user.id)
  }
  @Delete('api/oauth/connections/:id')
  revoke(@Param('id') id: string, @Req() req: any) {
    this.browserSession(req)
    return this.oauth.revoke(req.user.id, id)
  }
}
