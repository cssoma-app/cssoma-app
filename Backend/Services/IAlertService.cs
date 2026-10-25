using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface IAlertService
    {
        Task<ServiceResult<List<AlertDto>>> GetMyAlertsAsync();
        Task<ServiceResult> AcceptAlertAsync(Guid id);
        Task<ServiceResult> DeleteAlertAsync(Guid id);
        Task<ServiceResult> CreateAlertAsync(CreateAlertInput input);
    }

    public class AlertDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsAccepted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public string SenderName { get; set; } = string.Empty;
    }

    public class CreateAlertInput
    {
        public Guid RecipientUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
