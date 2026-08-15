using System;
using Microsoft.Extensions.Caching.Memory;

namespace BackendAPI.Services
{
    public class OTPService : IOTPService
    {
        private readonly IMemoryCache _cache;
        private readonly Random _random;
        private const int ExpirationMinutes = 5;

        public OTPService(IMemoryCache cache)
        {
            _cache = cache;
            _random = new Random();
        }

        public string GenerateCode(string email)
        {
            // Generar un código aleatorio de 4 dígitos (0000 - 9999)
            var code = _random.Next(1000, 10000).ToString();
            
            // Guardar en cache con expiración absoluta
            var cacheKey = GetCacheKey(email);
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(ExpirationMinutes));

            _cache.Set(cacheKey, code, cacheEntryOptions);
            return code;
        }

        public bool ValidateCode(string email, string code)
        {
            var cacheKey = GetCacheKey(email);
            if (_cache.TryGetValue(cacheKey, out string? savedCode))
            {
                if (savedCode == code)
                {
                    // Remover para que sea de un solo uso
                    _cache.Remove(cacheKey);
                    return true;
                }
            }
            return false;
        }

        private string GetCacheKey(string email) => $"verification_code_{email.ToLower().Trim()}";
    }
}
