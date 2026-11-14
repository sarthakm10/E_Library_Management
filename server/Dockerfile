# API image: builds the Spring Boot jar, then runs it on a slim Java 21 runtime.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
# Bundled covers. Compose mounts a volume here so uploaded covers survive rebuilds;
# on first start Docker copies these files into the empty volume.
COPY book_inventory ./book_inventory
ENV APP_UPLOAD_DIR=/app/book_inventory
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
