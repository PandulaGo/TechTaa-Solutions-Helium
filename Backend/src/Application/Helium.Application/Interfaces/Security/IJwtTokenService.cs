using Helium.Application.Models.Auth;

namespace Helium.Application.Interfaces.Security;

public interface IJwtTokenService
{
    string GenerateToken(UserTokenPayload payload);
}
