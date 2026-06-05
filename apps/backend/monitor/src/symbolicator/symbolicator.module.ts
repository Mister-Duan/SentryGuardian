import { Module } from '@nestjs/common';
import { SymbolicatorService } from './symbolicator.service.js';

@Module({
  providers: [SymbolicatorService],
  exports: [SymbolicatorService],
})
export class SymbolicatorModule {}
