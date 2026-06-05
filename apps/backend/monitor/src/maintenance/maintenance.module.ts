import { Module } from '@nestjs/common';
import { AlerterModule } from '../alerter/alerter.module.js';
import { MaintenanceService } from './maintenance.service.js';

@Module({
  imports: [AlerterModule],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
