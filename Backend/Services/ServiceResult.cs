namespace BackendAPI.Services
{
    public enum ServiceOutcome
    {
        Ok,
        BadRequest,
        NotFound,
        Forbidden,
        Error
    }

    // Resultado tipado que un service devuelve y el controller traduce a IActionResult —
    // mantiene la lógica de negocio (y sus distintos casos de error) fuera de la capa HTTP.
    public class ServiceResult
    {
        public ServiceOutcome Outcome { get; init; }
        public string? Message { get; init; }

        public static ServiceResult Ok(string? message = null) => new() { Outcome = ServiceOutcome.Ok, Message = message };
        public static ServiceResult BadRequest(string message) => new() { Outcome = ServiceOutcome.BadRequest, Message = message };
        public static ServiceResult NotFound(string message) => new() { Outcome = ServiceOutcome.NotFound, Message = message };
        public static ServiceResult Forbidden() => new() { Outcome = ServiceOutcome.Forbidden };
        public static ServiceResult Error(string message) => new() { Outcome = ServiceOutcome.Error, Message = message };
    }

    public class ServiceResult<T> : ServiceResult
    {
        public T? Data { get; init; }

        public static ServiceResult<T> Ok(T data, string? message = null) => new() { Outcome = ServiceOutcome.Ok, Data = data, Message = message };
        public static new ServiceResult<T> BadRequest(string message) => new() { Outcome = ServiceOutcome.BadRequest, Message = message };
        public static new ServiceResult<T> NotFound(string message) => new() { Outcome = ServiceOutcome.NotFound, Message = message };
        public static new ServiceResult<T> Forbidden() => new() { Outcome = ServiceOutcome.Forbidden };
        public static new ServiceResult<T> Error(string message) => new() { Outcome = ServiceOutcome.Error, Message = message };
    }
}
