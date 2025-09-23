"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map