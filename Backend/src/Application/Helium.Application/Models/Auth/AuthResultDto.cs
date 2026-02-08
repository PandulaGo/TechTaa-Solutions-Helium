using Helium.Application.Models.Users;

namespace Helium.Application.Models.Auth;

public class AuthResultDto
{
    public string Token { get; init; } = string.Empty;
    public UserDto User { get; init; } = new();
}
