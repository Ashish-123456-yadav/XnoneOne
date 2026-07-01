import { Global, Module } from '@nestjs/common';
import { PasswordService } from './auth/password.service';
import { TokenService } from './auth/token.service';
import { DatabaseService } from './database/database.service';
import { RealtimeHubService } from './realtime/realtime-hub.service';
import { StorageService } from './storage/storage.service';

@Global()
@Module({
  providers: [DatabaseService, PasswordService, TokenService, RealtimeHubService, StorageService],
  exports: [DatabaseService, PasswordService, TokenService, RealtimeHubService, StorageService],
})
export class InfrastructureModule {}
