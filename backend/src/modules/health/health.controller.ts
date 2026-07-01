import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'novasocial-api',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
