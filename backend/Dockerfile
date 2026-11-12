# Etapa de build: compila el jar con Maven y JDK 21.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# Etapa de ejecución: solo el JRE y el jar.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home spring
COPY --from=build /app/target/*.jar app.jar
USER spring
EXPOSE 8080
# Render inyecta PORT; en local cae a 8080.
ENTRYPOINT ["sh", "-c", "exec java -Dserver.port=${PORT:-8080} -jar app.jar"]
