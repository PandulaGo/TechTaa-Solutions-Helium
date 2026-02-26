using FluentValidation;
using Helium.Application.Models.Vehicles;

namespace Helium.Application.Validation.Vehicles;

public class VehicleCreateValidator : AbstractValidator<VehicleCreateDto>
{
    public VehicleCreateValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Make).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Model).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Year).InclusiveBetween(1900, DateTime.UtcNow.Year + 1).When(x => x.Year.HasValue);
        RuleFor(x => x.BodyType).IsInEnum();
        RuleFor(x => x.PowertrainType).IsInEnum();
    }
}
