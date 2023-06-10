import { Controller, Get, Request, Sse, UseGuards } from "@nestjs/common"
import { finalize, Observable } from "rxjs"
import { AppService } from "./app.service"
import { JwtAuthGuard } from "./auth/jwt-auth.guard"
import { MessageEvent } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"

@ApiTags("global")
@Controller()
export class AppController {}
