# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/CollaborativePresentation.Core/*.csproj ./CollaborativePresentation.Core/
COPY src/CollaborativePresentation.Infrastructure/*.csproj ./CollaborativePresentation.Infrastructure/
COPY src/CollaborativePresentation.API/*.csproj ./CollaborativePresentation.API/

RUN dotnet restore CollaborativePresentation.API/CollaborativePresentation.API.csproj

# Copy everything else and build
COPY src/CollaborativePresentation.Core/. ./CollaborativePresentation.Core/
COPY src/CollaborativePresentation.Infrastructure/. ./CollaborativePresentation.Infrastructure/
COPY src/CollaborativePresentation.API/. ./CollaborativePresentation.API/

WORKDIR /src/CollaborativePresentation.API
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "CollaborativePresentation.API.dll"]
