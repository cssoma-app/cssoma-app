using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BackendAPI.Filters;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace BackendAPI.Tests
{
    public class IdempotentFilterTests
    {
        private readonly Mock<IMemoryCache> _mockCache;
        private readonly IdempotentAttribute _filter;

        public IdempotentFilterTests()
        {
            _mockCache = new Mock<IMemoryCache>();
            _filter = new IdempotentAttribute();
        }

        private ActionExecutingContext CreateActionContext(string method, string? idempotencyHeaderValue)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = method;

            if (idempotencyHeaderValue != null)
            {
                httpContext.Request.Headers["Idempotency-Key"] = idempotencyHeaderValue;
            }

            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider.Setup(sp => sp.GetService(typeof(IMemoryCache)))
                .Returns(_mockCache.Object);
            httpContext.RequestServices = mockServiceProvider.Object;

            var actionContext = new ActionContext(
                httpContext,
                new RouteData(),
                new ActionDescriptor()
            );

            return new ActionExecutingContext(
                actionContext,
                new List<IFilterMetadata>(),
                new Dictionary<string, object?>(),
                new Mock<Controller>().Object
            );
        }

        [Fact]
        public async Task OnActionExecutionAsync_WithGetMethod_SkipsIdempotency()
        {
            // Arrange
            var context = CreateActionContext("GET", "key-123");
            var executed = false;
            ActionExecutionDelegate next = () =>
            {
                executed = true;
                return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new Mock<Controller>().Object));
            };

            // Act
            await _filter.OnActionExecutionAsync(context, next);

            // Assert
            Assert.True(executed);
            _mockCache.Verify(c => c.TryGetValue(It.IsAny<object>(), out It.Ref<object?>.IsAny), Times.Never);
        }

        [Fact]
        public async Task OnActionExecutionAsync_WithoutHeader_SkipsIdempotency()
        {
            // Arrange
            var context = CreateActionContext("POST", null);
            var executed = false;
            ActionExecutionDelegate next = () =>
            {
                executed = true;
                return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new Mock<Controller>().Object));
            };

            // Act
            await _filter.OnActionExecutionAsync(context, next);

            // Assert
            Assert.True(executed);
            _mockCache.Verify(c => c.TryGetValue(It.IsAny<object>(), out It.Ref<object?>.IsAny), Times.Never);
        }

        [Fact]
        public async Task OnActionExecutionAsync_WithDuplicateRequestInFlight_ReturnsConflict()
        {
            // Arrange
            var key = "key-dup-in-flight";
            var context = CreateActionContext("POST", key);
            
            object? inFlightMarker = Activator.CreateInstance(typeof(IdempotentAttribute).GetNestedType("InFlightRequest", System.Reflection.BindingFlags.NonPublic)!);
            _mockCache.Setup(c => c.TryGetValue($"Idempotency:{key}", out inFlightMarker)).Returns(true);

            var executed = false;
            ActionExecutionDelegate next = () =>
            {
                executed = true;
                return Task.FromResult(new ActionExecutedContext(context, new List<IFilterMetadata>(), new Mock<Controller>().Object));
            };

            // Act
            await _filter.OnActionExecutionAsync(context, next);

            // Assert
            Assert.False(executed);
            Assert.IsType<ConflictObjectResult>(context.Result);
        }
    }
}
