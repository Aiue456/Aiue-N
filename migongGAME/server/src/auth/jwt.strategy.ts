import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.warn('⚠️  WARNING: JWT_SECRET environment variable is not set.')
      console.warn('   Using a hardcoded fallback secret. This is INSECURE for production.')
      console.warn('   Set JWT_SECRET in your environment (e.g., .env file).')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'campus-maze-secret-key-2026',
    })
  }

  async validate(payload: any) {
    return { userId: payload.sub, account: payload.account }
  }
}
