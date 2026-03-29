FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY target/deal-tracker-parser-*.jar app.jar
VOLUME /data/snapshots
ENTRYPOINT ["java", "-jar", "app.jar"]
