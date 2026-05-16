# ===== Stage 1: build =====
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy pom trước để cache dependency layer
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copy source và build
COPY src ./src
RUN mvn -B clean package -DskipTests

# ===== Stage 2: runtime =====
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# User non-root cho an toàn
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
