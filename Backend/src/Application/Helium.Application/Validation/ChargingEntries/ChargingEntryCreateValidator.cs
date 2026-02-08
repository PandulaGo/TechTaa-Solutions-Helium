using FluentValidation;
using Helium.Application.Models.ChargingEntries;

namespace Helium.Application.Validation.ChargingEntries;

public class ChargingEntryCreateValidator : AbstractValidator<ChargingEntryCreateDto>
{
    public ChargingEntryCreateValidator()
    {
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.OdometerReadingKm).GreaterThanOrEqualTo(0);
        RuleFor(x => x.KwhUsed).GreaterThan(0);
        RuleFor(x => x.Cost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ChargingLocation).MaximumLength(200);
    }
}
