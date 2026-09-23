import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const grpcPort = port + 1; // El puerto gRPC será 5001 o 10001

  // Creamos la app HTTP estándar (para que Render vea que está "vivo" y pase el Health Check)
  const app = await NestFactory.create(AppModule);

  // Conectamos el microservicio gRPC en el puerto secundario
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'productos',
      protoPath: join(__dirname, 'productos.proto'),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
  
  console.log(`[HealthCheck] HTTP escuchando en 0.0.0.0:${port}`);
  console.log(`[Servicio] gRPC escuchando en 0.0.0.0:${grpcPort}`);
}
bootstrap();