using Helium.Domain.Common;

namespace Helium.Domain.Entities;

public class User : EntityBase
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string PreferredCurrency { get; set; } = "USD";

    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
