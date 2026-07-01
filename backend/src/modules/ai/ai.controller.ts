import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AiService } from './ai.service';

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  generate(@Body() body: Record<string, unknown>) {
    return this.aiService.generate(body);
  }

  @Post('generate/batch')
  generateBatch(@Body() body: Record<string, unknown>) {
    return this.aiService.generateBatch(body);
  }

  @Post('transcribe')
  transcribe(@Body() body: Record<string, unknown>) {
    return this.aiService.transcribe(body);
  }
}
