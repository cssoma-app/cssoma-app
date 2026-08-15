CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Tenants" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Tenants" PRIMARY KEY ("Id")
);

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

CREATE TABLE "Employees" (
    "Id" uuid NOT NULL,
    "TenantId" uuid NOT NULL,
    "FullName" text NOT NULL,
    "Email" text NOT NULL,
    "Position" text NOT NULL,
    CONSTRAINT "PK_Employees" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Employees_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "TenantId" uuid,
    "SupabaseAuthId" text NOT NULL,
    "Role" integer NOT NULL,
    "Email" text NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Users_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id")
);

CREATE INDEX "IX_Documents_TenantId_ExpirationDate" ON "Documents" ("TenantId", "ExpirationDate");

CREATE INDEX "IX_Employees_TenantId" ON "Employees" ("TenantId");

CREATE UNIQUE INDEX "IX_Users_SupabaseAuthId" ON "Users" ("SupabaseAuthId");

CREATE INDEX "IX_Users_TenantId" ON "Users" ("TenantId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260810191754_InitialSchema', '10.0.10');

COMMIT;

START TRANSACTION;
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260811030549_InitialCreate', '10.0.10');

COMMIT;

