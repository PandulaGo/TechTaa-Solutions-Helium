using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        return Ok(new { status = "ok" });
    }
}
