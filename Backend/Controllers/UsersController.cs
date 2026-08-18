using System;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Filters;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Controller delgado: toda la lógica de negocio vive en IUserService (Regla 2, AGENTS.md).
    [Idempotent]
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("available-services")]
        public async Task<IActionResult> GetAvailableServices([FromQuery] Guid? tenantId = null)
        {
            var result = await _userService.GetAvailableServicesAsync(tenantId);
            return this.ToActionResult(result);
        }

        [HttpGet("available-dashboard-cards")]
        public async Task<IActionResult> GetAvailableDashboardCards([FromQuery] Guid? tenantId = null)
        {
            var result = await _userService.GetAvailableDashboardCardsAsync(tenantId);
            return this.ToActionResult(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] Guid? tenantId = null)
        {
            var result = await _userService.GetUsersAsync(search, page, tenantId);
            return this.ToActionResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateUserAsync(new CreateUserInput
            {
                FullName = request?.FullName ?? string.Empty,
                Email = request?.Email ?? string.Empty,
                TenantId = request?.TenantId,
                RoleKey = request?.RoleKey,
                ServiceIds = request?.ServiceIds,
                DashboardCardIds = request?.DashboardCardIds
            });
            return this.ToActionResult(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            var result = await _userService.UpdateUserAsync(id, new UpdateUserInput
            {
                FullName = request?.FullName ?? string.Empty,
                Email = request?.Email ?? string.Empty,
                RoleKey = request?.RoleKey,
                ServiceIds = request?.ServiceIds,
                DashboardCardIds = request?.DashboardCardIds
            });
            return this.ToActionResult(result);
        }

        [HttpPost("resend-invitation/{id}")]
        public async Task<IActionResult> ResendInvitation(Guid id)
        {
            var result = await _userService.ResendInvitationAsync(id);
            return this.ToActionResult(result);
        }

        [HttpPost("toggle-active/{id}")]
        public async Task<IActionResult> ToggleActive(Guid id)
        {
            var result = await _userService.ToggleActiveAsync(id);
            return this.ToActionResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var result = await _userService.DeleteUserAsync(id);
            return this.ToActionResult(result);
        }
    }
}
