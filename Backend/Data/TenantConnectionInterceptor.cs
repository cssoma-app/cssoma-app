using System;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using BackendAPI.Services;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace BackendAPI.Data
{
    public class TenantConnectionInterceptor : DbConnectionInterceptor
    {
        private readonly IServiceProvider _serviceProvider;

        public TenantConnectionInterceptor(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
        {
            SetSessionVariables(connection);
            base.ConnectionOpened(connection, eventData);
        }

        public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData, CancellationToken cancellationToken = default)
        {
            await SetSessionVariablesAsync(connection);
            await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
        }

        private void SetSessionVariables(DbConnection connection)
        {
            using var scope = _serviceProvider.CreateScope();
            var currentUserService = scope.ServiceProvider.GetService<ICurrentUserService>();
            if (currentUserService == null) return;

            var tenantId = currentUserService.TenantId?.ToString() ?? string.Empty;
            var isSuperAdmin = currentUserService.IsSuperAdmin ? "true" : "false";

            using var command = connection.CreateCommand();
            command.CommandText = $"SET app.current_tenant_id = '{tenantId}'; SET app.is_super_admin = '{isSuperAdmin}';";
            command.ExecuteNonQuery();
        }

        private async Task SetSessionVariablesAsync(DbConnection connection)
        {
            using var scope = _serviceProvider.CreateScope();
            var currentUserService = scope.ServiceProvider.GetService<ICurrentUserService>();
            if (currentUserService == null) return;

            var tenantId = currentUserService.TenantId?.ToString() ?? string.Empty;
            var isSuperAdmin = currentUserService.IsSuperAdmin ? "true" : "false";

            using var command = connection.CreateCommand();
            command.CommandText = $"SET app.current_tenant_id = '{tenantId}'; SET app.is_super_admin = '{isSuperAdmin}';";
            await command.ExecuteNonQueryAsync();
        }
    }
}
