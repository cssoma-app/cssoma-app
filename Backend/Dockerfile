FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY BackendAPI.csproj ./
RUN dotnet restore BackendAPI.csproj

COPY . .
RUN dotnet publish BackendAPI.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Npgsql's TLS negotiation (required by Supabase's connection pooler) needs
# libgssapi_krb5.so.2, which this slim base image doesn't include by default.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Render injects PORT at runtime; fall back to 8080 for local `docker run`.
ENTRYPOINT ["sh", "-c", "dotnet BackendAPI.dll --urls http://+:${PORT:-8080}"]
