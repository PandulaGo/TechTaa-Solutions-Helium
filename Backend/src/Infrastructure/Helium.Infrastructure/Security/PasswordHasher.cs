using Helium.Application.Interfaces.Security;
using System.Security.Cryptography;
using System.Text;

namespace Helium.Infrastructure.Security;

public class PasswordHasher : IPasswordHasher
{
    public (string Hash, string Salt) HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var salt = Convert.ToBase64String(saltBytes);
        var hash = Hash(password, salt);
        return (hash, salt);
    }

    public bool Verify(string password, string hash, string salt)
    {
        return Hash(password, salt) == hash;
    }

    private static string Hash(string password, string salt)
    {
        var bytes = Encoding.UTF8.GetBytes(password + salt);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}
