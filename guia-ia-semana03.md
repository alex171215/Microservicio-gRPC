### Declaración de uso de IA
- Herramienta(s): Gemini 3.1 Pro (High) (integrado en el IDE Antigravity)
- Nivel de uso: Asistencia en escritura de código, explicación de asincronía y resolución de errores.
- Qué se le pidió:
  1. Solucionar el error `ENOENT` del script `cliente.js` con la ruta del `.proto`.
  2. Explicar por qué el log de error de gRPC salía desordenado (asíncrono) junto con la llamada unary.
  3. Agregar el método `BuscarPorPrecioMaximo` en el `.proto`, en `app.controller.ts` y consumirlo en `cliente.js`.
  4. Agregar esta estructura y responder a las preguntas teóricas solicitadas.
  5. Redactar una comparación entre la experiencia de desarrollar con gRPC y REST.
- Qué se modificó/verificó manualmente: Se verificaron las ejecuciones en la terminal, se detuvo y reinició manualmente el servidor Nest (`npm run start`), y se confirmó que la salida del script cumpliera exactamente con los requisitos del taller. Se revisó y adaptó la comparación de gRPC vs REST al contexto de aprendizaje.

---

### ¿Por qué este método (BuscarPorPrecioMaximo) debería ser server streaming y no unary?
Repasando el "Mapa de decisión rápido" de la teoría (sección 3.4), sabemos que el cliente envía **una sola solicitud** (el filtro con el precio máximo), pero la respuesta puede contener **múltiples resultados (número variable)**. 

Si fuera un método *Unary*, el servidor tendría que cargar todos los productos filtrados en memoria, armar un solo arreglo gigante y enviarlo todo de golpe. Esto consume más recursos (memoria) y obliga al cliente a esperar a que el servidor termine todo el proceso.
En cambio, usando **Server Streaming**, el servidor puede enviar los productos uno por uno a medida que los va encontrando. Esto reduce el consumo de memoria y le permite al cliente comenzar a procesar los datos de inmediato sin esperar al final de la búsqueda.

### Interpretando errores de @grpc/proto-loader
Si al ejecutar Node te aparece un error como `ENOENT: no such file or directory, open '.../src/productos.proto'`, no es un problema del código gRPC en sí, sino de que el paquete `@grpc/proto-loader` no puede encontrar el archivo físico.
`protoLoader.loadSync()` requiere leer el archivo `.proto` real desde el disco para compilar dinámicamente los mensajes y servicios. A diferencia de Nest, que empaqueta automáticamente los `.proto` gracias a `nest-cli.json`, en un script de Node puro debemos pasarle la ruta correcta. 
La solución es asegurarnos de construir la ruta absoluta correctamente utilizando `path.join(__dirname, ...)` desde la ubicación del script que estamos ejecutando, apuntando a la carpeta donde realmente vive el `.proto`.

### Esqueleto del método server streaming en NestJS

```typescript
import { Observable } from 'rxjs';
import { GrpcMethod } from '@nestjs/microservices';

@GrpcMethod('NombreDelServicio', 'NombreDelMetodo')
nombreDelMetodo(data: RequestType): Observable<ResponseType> {
  // Retornamos un Observable para emitir múltiples valores a lo largo del tiempo
  return new Observable((subscriber) => {
    
    // 1. Aquí empieza la lógica (por ejemplo, buscar datos en un ciclo)
    
    // 2. Por cada elemento que queramos enviar al cliente, llamamos a .next()
    subscriber.next({ /* objeto de tipo ResponseType */ });
    
    // 3. Cuando ya no hay más elementos por enviar, cerramos el stream
    subscriber.complete();
    
    // Opcional: si ocurre un error en medio del proceso
    // subscriber.error(new RpcException('Mensaje de error'));
  });
}
```

**¿Por qué retorna un Observable?**
Porque un `Observable` (del paquete RxJS) representa un flujo o colección de valores que se emiten a lo largo del tiempo. Es la forma estándar y natural que utiliza NestJS para mapear el comportamiento de "streaming continuo" de gRPC.

**¿Qué hacen subscriber.next() y subscriber.complete()?**
- `subscriber.next(dato)`: Empuja o emite un dato hacia el canal del stream para que llegue al cliente. Se llama tantas veces como elementos se deseen enviar.
- `subscriber.complete()`: Le indica a gRPC (y por ende al cliente) que el servidor ha terminado su trabajo y no enviará más datos, cerrando la conexión del stream exitosamente.

---

### gRPC en NestJS vs REST (Semana 2)
Implementar **REST** fue más rápido de escribir inicialmente por su simplicidad (rutas directas y respuestas JSON predecibles). En cambio, **gRPC** requiere definir un contrato estricto en el `.proto`, añadiendo más configuración previa (como el *proto-loader*). Esto también hizo que gRPC fuera un poco **más difícil de depurar**; los errores (como fallos asíncronos en los observables, rutas faltantes al compilar o códigos numéricos no tan claros) exigen herramientas específicas y una revisión del código fuente más minuciosa que simplemente probar una URL en Postman o en el navegador.
