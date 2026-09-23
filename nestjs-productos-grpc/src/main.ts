import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // El Gateway usará process.env.PORT. El gRPC debe usar otro puerto para no chocar (EADDRINUSE).
  const grpcPort = 10001; 
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'productos',
      protoPath: join(__dirname, 'productos.proto'),
      url: `127.0.0.1:${grpcPort}`,
    },
  });
  
  await app.listen();
  console.log(`[Servicio] gRPC escuchando localmente en 127.0.0.1:${grpcPort}`);
}
bootstrap();