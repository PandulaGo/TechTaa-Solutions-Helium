using FluentValidation;
using Helium.Application.Models.Maintenance;

namespace Helium.Application.Validation.Maintenance;

public class MaintenanceRecordCreateValidator : AbstractValidator<MaintenanceRecordCreateDto>
{
    public MaintenanceRecordCreateValidator()
    {
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.MaintenanceType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OdometerReadingKm).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ServiceDate).NotEmpty();
    }
}
