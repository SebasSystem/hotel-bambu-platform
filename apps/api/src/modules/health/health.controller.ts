import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../common/request-context.js';
import { HealthService, type HealthReport } from './health.service.js';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** 200 when the API and its database answer; 503 otherwise (no internal details leaked). */
  @Get()
  async check(): Promise<HealthReport> {
    const report = await this.health.check();
    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
