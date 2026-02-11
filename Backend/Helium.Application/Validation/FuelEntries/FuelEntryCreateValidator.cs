using FluentValidation;
using Helium.Application.Models.FuelEntries;

namespace Helium.Application.Validation.FuelEntries;

public class FuelEntryCreateValidator : AbstractValidator<FuelEntryCreateDto>
{
    public FuelEntryCreateValidator()
    {
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.OdometerReadingKm).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Liters).GreaterThan(0);
        RuleFor(x => x.Cost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FuelStationName).MaximumLength(200);
    }
}
