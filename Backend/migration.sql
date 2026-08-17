-- SSTerra CSOMA — schema de base de datos (Supabase / PostgreSQL)
--
-- Generado automaticamente desde las migraciones de EF Core, NO editar a mano.
-- Para regenerar despues de crear una migracion nueva:
--   cd Backend
--   dotnet ef migrations script --idempotent -o migration.sql --project BackendAPI.csproj
--
-- Es idempotente: usa IF NOT EXISTS contra __EFMigrationsHistory, es seguro
-- pegarlo entero en el SQL Editor de Supabase las veces que haga falta (no
-- duplica tablas ni relanza migraciones ya aplicadas).
--
-- NO incluye datos semilla (SuperAdmin, SassServices por defecto): esos los
-- siembra la app sola al arrancar (Backend/Data/DatabaseInitializer.cs), no
-- viven en este script.
--
-- Ultima migracion incluida: 20260814043824_AddTenantIsActive

CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE TABLE "Tenants" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Tenants" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE TABLE "Documents" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "Title" text NOT NULL,
        "FileUrl" text NOT NULL,
        "ExpirationDate" timestamp with time zone,
        "Status" integer NOT NULL,
        "Type" integer NOT NULL,
        CONSTRAINT "PK_Documents" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Documents_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE TABLE "Employees" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "FullName" text NOT NULL,
        "Email" text NOT NULL,
        "Position" text NOT NULL,
        CONSTRAINT "PK_Employees" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Employees_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE TABLE "Users" (
        "Id" uuid NOT NULL,
        "TenantId" uuid,
        "SupabaseAuthId" text NOT NULL,
        "Role" integer NOT NULL,
        "Email" text NOT NULL,
        CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Users_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE INDEX "IX_Documents_TenantId_ExpirationDate" ON "Documents" ("TenantId", "ExpirationDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE INDEX "IX_Employees_TenantId" ON "Employees" ("TenantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE UNIQUE INDEX "IX_Users_SupabaseAuthId" ON "Users" ("SupabaseAuthId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    CREATE INDEX "IX_Users_TenantId" ON "Users" ("TenantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260810191754_InitialSchema') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260810191754_InitialSchema', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260811030549_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260811030549_InitialCreate', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813171105_AddPasswordHash') THEN
    ALTER TABLE "Users" ADD "PasswordHash" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813171105_AddPasswordHash') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260813171105_AddPasswordHash', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    ALTER TABLE "Employees" ENABLE ROW LEVEL SECURITY;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    DROP POLICY IF EXISTS tenant_employees_policy ON "Employees";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    CREATE POLICY tenant_employees_policy ON "Employees" USING ("TenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.is_super_admin', true) = 'true');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    ALTER TABLE "Documents" ENABLE ROW LEVEL SECURITY;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    DROP POLICY IF EXISTS tenant_documents_policy ON "Documents";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    CREATE POLICY tenant_documents_policy ON "Documents" USING ("TenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.is_super_admin', true) = 'true');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813224902_AddRowLevelSecurity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260813224902_AddRowLevelSecurity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813234810_AddUserFullName') THEN
    ALTER TABLE "Users" ADD "FullName" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260813234810_AddUserFullName') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260813234810_AddUserFullName', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814035951_AddTenantFieldsAndTempPass') THEN
    ALTER TABLE "Users" ADD "IsTemporaryPassword" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814035951_AddTenantFieldsAndTempPass') THEN
    ALTER TABLE "Tenants" ADD "Direccion" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814035951_AddTenantFieldsAndTempPass') THEN
    ALTER TABLE "Tenants" ADD "NitRuc" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814035951_AddTenantFieldsAndTempPass') THEN
    ALTER TABLE "Tenants" ADD "RazonSocial" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814035951_AddTenantFieldsAndTempPass') THEN
    ALTER TABLE "Tenants" ADD "Telefono" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814035951_AddTenantFieldsAndTempPass') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260814035951_AddTenantFieldsAndTempPass', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814040240_AddSassServicesTable') THEN
    CREATE TABLE "SassServices" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Name" text NOT NULL,
        "Description" text NOT NULL,
        "IsEnabled" boolean NOT NULL,
        CONSTRAINT "PK_SassServices" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814040240_AddSassServicesTable') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260814040240_AddSassServicesTable', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814043824_AddTenantIsActive') THEN
    ALTER TABLE "Tenants" ADD "IsActive" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260814043824_AddTenantIsActive') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260814043824_AddTenantIsActive', '10.0.10');
    END IF;
END $EF$;
COMMIT;

