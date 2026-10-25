using System;

namespace BackendAPI.Contracts
{
    public class CreateAlertRequest
    {
        public Guid RecipientUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
