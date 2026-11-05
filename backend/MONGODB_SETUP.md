# MongoDB para MyOrbit

El backend lee la conexión de las propiedades `spring.mongodb.uri` y `spring.mongodb.database`.
Se definen en `backend/application-local.properties`, que Git ignora, para no subir credenciales.

```bash
cd backend
cp application-local.properties.example application-local.properties
```

Si el archivo no existe, Spring usa `mongodb://localhost:27017/myorbit`. La base se llama `myorbit`
y las colecciones principales son `users`, `user_sessions`, `tasks`, `habits`, `categories`, `subjects` y `user_profiles`.

## Opción 1: MongoDB local

Con Docker:

```bash
docker run -d --name myorbit-mongo -p 27017:27017 mongo:7
```

O instala MongoDB Community Server y deja el servicio iniciado (en Windows: `Start-Service MongoDB`).
Con la URI por defecto no necesitas editar nada.

## Opción 2: MongoDB Atlas personal

1. Crea un cluster gratuito en MongoDB Atlas.
2. Crea un usuario de base de datos y permite tu IP en Network Access.
3. Copia la cadena `mongodb+srv://...` en `spring.mongodb.uri` dentro de `application-local.properties`.

No guardes la URI de Atlas ni contraseñas en `application.properties` ni en Git.

## Arrancar y verificar

```bash
./mvnw spring-boot:run
```

Los endpoints exigen sesión. Registra un usuario, inicia sesión y consulta con el token recibido:

```bash
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Prueba","email":"prueba@uni.edu","password":"Clave1234"}'
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"prueba@uni.edu","password":"Clave1234"}'
curl http://localhost:8080/api/tasks -H "Authorization: Bearer <token>"
```

## Tests

Los tests de integración usan Testcontainers y levantan su propio MongoDB: necesitas Docker, pero no Atlas.
