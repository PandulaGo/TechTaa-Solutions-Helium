using FluentValidation;
using Helium.Application.Models.Maintenance;

namespace Helium.Application.Validation.Maintenance;

public class MaintenanceRecordUpdateValidator : AbstractValidator<MaintenanceRecordUpdateDto>
{
    public MaintenanceRecordUpdateValidator()
    {
        RuleFor(x => x.MaintenanceType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OdometerReadingKm).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ServiceDate).NotEmpty();
    }
}
