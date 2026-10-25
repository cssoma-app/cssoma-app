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

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    DROP INDEX "IX_Users_TenantId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    ALTER TABLE "Users" ADD "IsDisabled" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    ALTER TABLE "Users" ADD "LastLoginAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    ALTER TABLE "Users" ADD "RoleId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    CREATE TABLE "Roles" (
        "Id" uuid NOT NULL,
        "Key" text NOT NULL,
        "DisplayName" text NOT NULL,
        CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    CREATE UNIQUE INDEX "IX_Roles_Key" ON "Roles" ("Key");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN

                    INSERT INTO "Roles" ("Id", "Key", "DisplayName") VALUES
                        ('11111111-1111-1111-1111-111111111111', 'SuperAdmin', 'Super Administrador'),
                        ('22222222-2222-2222-2222-222222222222', 'Admin', 'Administrador de Empresa'),
                        ('33333333-3333-3333-3333-333333333333', 'Member', 'Colaborador')
                    ON CONFLICT ("Id") DO NOTHING;
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN

                    UPDATE "Users" SET "RoleId" =
                        CASE "Role"
                            WHEN 0 THEN '22222222-2222-2222-2222-222222222222'::uuid
                            WHEN 2 THEN '11111111-1111-1111-1111-111111111111'::uuid
                            ELSE '33333333-3333-3333-3333-333333333333'::uuid
                        END
                    WHERE "RoleId" IS NULL;
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    ALTER TABLE "Users" ALTER COLUMN "RoleId" SET NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    CREATE INDEX "IX_Users_RoleId" ON "Users" ("RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    CREATE INDEX "IX_Users_TenantId_IsDisabled" ON "Users" ("TenantId", "IsDisabled");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    ALTER TABLE "Users" ADD CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818025612_AddRbacRolesAndUserStatus') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260818025612_AddRbacRolesAndUserStatus', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818032419_AddTenantPlatformOwner') THEN
    ALTER TABLE "Tenants" ADD "IsPlatformOwner" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818032419_AddTenantPlatformOwner') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260818032419_AddTenantPlatformOwner', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818034742_DropLegacyRoleColumn') THEN
    ALTER TABLE "Users" DROP COLUMN "Role";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818034742_DropLegacyRoleColumn') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260818034742_DropLegacyRoleColumn', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818035922_AddRoleIsSystemFlag') THEN
    ALTER TABLE "Roles" ADD "IsSystemRole" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818035922_AddRoleIsSystemFlag') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260818035922_AddRoleIsSystemFlag', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    ALTER TABLE "SassServices" ADD "Key" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    ALTER TABLE "SassServices" ADD "ParentKey" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    DELETE FROM "SassServices";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN

                    INSERT INTO "SassServices" ("Key", "ParentKey", "Name", "Description", "IsEnabled") VALUES
                        ('documents', NULL, 'Documentos', 'Gestión documental de seguridad e higiene.', true),
                        ('tenants', NULL, 'Administración Empresas', 'Alta y administración de empresas clientes de la plataforma.', true),
                        ('users', 'admin', 'Usuarios', 'Gestión de cuentas de acceso al sistema.', true),
                        ('roles', 'admin', 'Roles', 'Catálogo de roles del sistema.', true),
                        ('services', 'admin', 'Servicios Globales', 'Catálogo de servicios/menús activables de la plataforma.', true),
                        ('pipeline', 'development', 'Pipeline CI/CD', 'Estado del pipeline de integración y despliegue continuo.', true);
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    CREATE TABLE "TenantServices" (
        "EnabledServicesId" integer NOT NULL,
        "TenantsId" uuid NOT NULL,
        CONSTRAINT "PK_TenantServices" PRIMARY KEY ("EnabledServicesId", "TenantsId"),
        CONSTRAINT "FK_TenantServices_SassServices_EnabledServicesId" FOREIGN KEY ("EnabledServicesId") REFERENCES "SassServices" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_TenantServices_Tenants_TenantsId" FOREIGN KEY ("TenantsId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    CREATE TABLE "UserServices" (
        "EnabledServicesId" integer NOT NULL,
        "UsersId" uuid NOT NULL,
        CONSTRAINT "PK_UserServices" PRIMARY KEY ("EnabledServicesId", "UsersId"),
        CONSTRAINT "FK_UserServices_SassServices_EnabledServicesId" FOREIGN KEY ("EnabledServicesId") REFERENCES "SassServices" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_UserServices_Users_UsersId" FOREIGN KEY ("UsersId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN

                    INSERT INTO "TenantServices" ("TenantsId", "EnabledServicesId")
                    SELECT t."Id", s."Id" FROM "Tenants" t CROSS JOIN "SassServices" s;
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN

                    INSERT INTO "UserServices" ("UsersId", "EnabledServicesId")
                    SELECT u."Id", s."Id" FROM "Users" u CROSS JOIN "SassServices" s;
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    CREATE UNIQUE INDEX "IX_SassServices_Key" ON "SassServices" ("Key");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    CREATE INDEX "IX_TenantServices_TenantsId" ON "TenantServices" ("TenantsId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    CREATE INDEX "IX_UserServices_UsersId" ON "UserServices" ("UsersId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818050037_AddServiceCatalogAndAssignments') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260818050037_AddServiceCatalogAndAssignments', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818155424_AddAccountLockout') THEN
    ALTER TABLE "Users" ADD "FailedLoginAttempts" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818155424_AddAccountLockout') THEN
    ALTER TABLE "Users" ADD "LockedUntil" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260818155424_AddAccountLockout') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260818155424_AddAccountLockout', '10.0.10');
    END IF;
END $EF$;
COMMIT;

