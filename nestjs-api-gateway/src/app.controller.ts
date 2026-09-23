import { Controller, Get, Param, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { Client } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { credentials } from '@grpc/grpc-js';

interface ProductoRequest { id: number; }
interface FiltroPrecioRequest { precioMaximo: number; }
interface ProductoResponse { id: number; nombre: string; precio: number; }

interface ProductoService {
  obtenerProducto(data: ProductoRequest): Observable<ProductoResponse>;
  listarProductos(data: {}): Observable<ProductoResponse>;
  buscarPorPrecioMaximo(data: FiltroPrecioRequest): Observable<ProductoResponse>;
}

@ApiTags('productos')
@Controller('productos')
export class AppController implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'productos',
      protoPath: join(import.meta.dirname, 'productos.proto'),
      url: process.env.GRPC_URL || '127.0.0.1:10001',
      credentials: credentials.createInsecure(),
    },
  })
  private client: ClientGrpc;

  private productoService: ProductoService;

  onModuleInit() {
    this.productoService = this.client.getService<ProductoService>('ProductoService');
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los productos' })
  listarProductos(): Observable<ProductoResponse[]> {
    // Usamos toArray() para agrupar el stream gRPC en un JSON array para REST
    return this.productoService.listarProductos({}).pipe(toArray());
  }

  @Get('filtro/:precioMaximo')
  @ApiOperation({ summary: 'Filtrar productos por precio máximo' })
  buscarPorPrecioMaximo(@Param('precioMaximo', ParseIntPipe) precioMaximo: number): Observable<ProductoResponse[]> {
    return this.productoService.buscarPorPrecioMaximo({ precioMaximo }).pipe(toArray());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  obtenerProducto(@Param('id', ParseIntPipe) id: number): Observable<ProductoResponse> {
    return this.productoService.obtenerProducto({ id });
  }
}
