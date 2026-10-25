using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Helpers;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    // Regla 2, AGENTS.md: toda la lógica de negocio vive aquí, no en el controller.
    public class AlertService : IAlertService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public AlertService(ApplicationDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        public async Task<ServiceResult<List<AlertDto>>> GetMyAlertsAsync()
        {
            if (!_currentUserService.UserId.HasValue)
            {
                return ServiceResult<List<AlertDto>>.Forbidden();
            }

            var userId = _currentUserService.UserId.Value;

            var alerts = await _dbContext.Alerts
                .Where(a => a.RecipientUserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AlertDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Message = a.Message,
                    IsAccepted = a.IsAccepted,
                    CreatedAt = a.CreatedAt,
                    AcceptedAt = a.AcceptedAt,
                    SenderName = _dbContext.Users
                        .IgnoreQueryFilters()
                        .Where(u => u.Id == a.CreatedByUserId)
                        .Select(u => u.FullName)
                        .FirstOrDefault() ?? ""
                })
                .ToListAsync();

            return ServiceResult<List<AlertDto>>.Ok(alerts);
        }

        public async Task<ServiceResult> AcceptAlertAsync(Guid id)
        {
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.Id == id);
            if (alert == null)
            {
                return ServiceResult.NotFound("Alerta no encontrada.");
            }

            // Solo el destinatario puede aceptar su propia alerta — nunca confiar solo en el
            // Global Query Filter para autorización de un registro puntual.
            if (!_currentUserService.UserId.HasValue || alert.RecipientUserId != _currentUserService.UserId.Value)
            {
                return ServiceResult.Forbidden();
            }

            alert.IsAccepted = true;
            alert.AcceptedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Alerta aceptada.");
        }

        public async Task<ServiceResult> DeleteAlertAsync(Guid id)
        {
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.Id == id);
            if (alert == null)
            {
                return ServiceResult.NotFound("Alerta no encontrada.");
            }

            if (!_currentUserService.UserId.HasValue || alert.RecipientUserId != _currentUserService.UserId.Value)
            {
                return ServiceResult.Forbidden();
            }

            _dbContext.Alerts.Remove(alert);
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Alerta eliminada.");
        }

        public async Task<ServiceResult> CreateAlertAsync(CreateAlertInput input)
        {
            if (!_currentUserService.UserId.HasValue)
            {
                return ServiceResult.Forbidden();
            }

            var titleCleaned = InputSanitizer.SanitizeText(input.Title);
            var messageCleaned = InputSanitizer.SanitizeText(input.Message);

            if (string.IsNullOrWhiteSpace(titleCleaned) || string.IsNullOrWhiteSpace(messageCleaned))
            {
                return ServiceResult.BadRequest("El título y el mensaje de la alerta son requeridos.");
            }

            var recipient = await _dbContext.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == input.RecipientUserId);
            if (recipient == null)
            {
                return ServiceResult.BadRequest("El usuario destinatario no existe.");
            }

            // Un Admin solo puede alertar a usuarios de su propia empresa (sin importar si es
            // o no el tenant propietario de la plataforma). SuperAdmin puede alertar a cualquiera.
            if (!_currentUserService.IsSuperAdmin)
            {
                if (!_currentUserService.IsAdmin || recipient.TenantId != _currentUserService.TenantId)
                {
                    return ServiceResult.Forbidden();
                }
            }

            var alert = new Alert
            {
                Id = Guid.NewGuid(),
                TenantId = recipient.TenantId,
                RecipientUserId = recipient.Id,
                CreatedByUserId = _currentUserService.UserId.Value,
                Title = titleCleaned,
                Message = messageCleaned,
                IsAccepted = false,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Alerts.Add(alert);
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Alerta enviada con éxito.");
        }
    }
}
