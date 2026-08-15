using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;

namespace BackendAPI.Filters
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class IdempotentAttribute : Attribute, IAsyncActionFilter
    {
        private const string IdempotencyHeaderName = "Idempotency-Key";

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var request = context.HttpContext.Request;

            // Solo aplicar idempotencia en POST y PATCH (peticiones no idempotentes por especificación)
            if (!HttpMethods.IsPost(request.Method) && !HttpMethods.IsPatch(request.Method))
            {
                await next();
                return;
            }

            // Validar existencia de la cabecera de Idempotencia
            if (!request.Headers.TryGetValue(IdempotencyHeaderName, out var idempotencyKey) || 
                string.IsNullOrWhiteSpace(idempotencyKey))
            {
                // Es opcional pero recomendado. Si no viene la cabecera, se procesa normalmente.
                await next();
                return;
            }

            var cache = context.HttpContext.RequestServices.GetService(typeof(IMemoryCache)) as IMemoryCache;
            if (cache == null)
            {
                await next();
                return;
            }

            var cacheKey = $"Idempotency:{idempotencyKey}";

            // 1. Validar si ya existe en caché
            if (cache.TryGetValue(cacheKey, out object? cachedResponse))
            {
                if (cachedResponse is InFlightRequest)
                {
                    // Conflicto de petición concurrente en procesamiento
                    context.Result = new ConflictObjectResult(new 
                    { 
                        Message = "Esta solicitud ya se está procesando actualmente. Por favor, espera un momento." 
                    });
                    return;
                }

                if (cachedResponse is CachedResult storedResult)
                {
                    // Retornar la misma respuesta guardada previamente
                    context.Result = new ObjectResult(storedResult.Value) 
                    { 
                        StatusCode = storedResult.StatusCode 
                    };
                    return;
                }
            }

            // 2. Registrar la petición como "en vuelo"
            cache.Set(cacheKey, new InFlightRequest(), TimeSpan.FromMinutes(2));

            var executedContext = await next();

            // 3. Evaluar resultado final
            if (executedContext.Result is ObjectResult objectResult && 
                objectResult.StatusCode >= 200 && objectResult.StatusCode < 300)
            {
                // Almacenar el resultado exitoso (2xx) en caché por 10 minutos
                cache.Set(cacheKey, new CachedResult 
                { 
                    StatusCode = objectResult.StatusCode ?? 200, 
                    Value = objectResult.Value 
                }, TimeSpan.FromMinutes(10));
            }
            else
            {
                // Si la petición falló (ej. error 400, 500, etc.), remover de caché para posibilitar reintento limpio
                cache.Remove(cacheKey);
            }
        }

        private class InFlightRequest { }

        private class CachedResult
        {
            public int StatusCode { get; set; }
            public object? Value { get; set; }
        }
    }
}
