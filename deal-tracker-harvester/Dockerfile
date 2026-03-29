FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY target/deal-tracker-harvester-*.jar app.jar
VOLUME /data/snapshots
ENTRYPOINT ["java", "-jar", "app.jar"]
