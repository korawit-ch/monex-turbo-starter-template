import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/auth.decorators';
import { AppService } from './app.service';

@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo() {
    return this.appService.getInfo();
  }
}
