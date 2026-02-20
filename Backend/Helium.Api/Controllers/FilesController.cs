using Helium.Application.Interfaces.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Helium.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public FilesController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpPost("receipts")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<string>> UploadReceipt(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest("Empty file.");
        }

        await using var stream = file.OpenReadStream();
        var path = await _fileStorageService.SaveAsync(stream, file.FileName, cancellationToken);
        return Ok(new { path });
    }
}
