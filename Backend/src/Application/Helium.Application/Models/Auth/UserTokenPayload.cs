namespace Helium.Application.Models.Auth;

public class UserTokenPayload
{
    public Guid UserId { get; init; }
    public string Email { get; init; } = string.Empty;
}
