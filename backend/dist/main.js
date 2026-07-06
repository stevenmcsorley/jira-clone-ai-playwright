"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const skylark_exception_filter_1 = require("./skylark/skylark-exception.filter");
const skylark_reporter_1 = require("./skylark/skylark.reporter");
process.on('unhandledRejection', reason => (0, skylark_reporter_1.reportToSkylark)(reason, { tags: ['backend', 'unhandledRejection'] }));
process.on('uncaughtException', err => (0, skylark_reporter_1.reportToSkylark)(err, { tags: ['backend', 'uncaughtException'] }));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    const { httpAdapter } = app.get(core_1.HttpAdapterHost);
    app.useGlobalFilters(new skylark_exception_filter_1.SkylarkExceptionFilter(httpAdapter));
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