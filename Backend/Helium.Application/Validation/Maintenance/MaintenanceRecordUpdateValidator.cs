using FluentValidation;
using Helium.Application.Models.Maintenance;
using Helium.Domain.Enums;

namespace Helium.Application.Validation.Maintenance;

public class MaintenanceRecordUpdateValidator : AbstractValidator<MaintenanceRecordUpdateDto>
{
    public MaintenanceRecordUpdateValidator()
    {
        RuleFor(x => x.MaintenanceType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OdometerReadingKm).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ServiceDate).NotEmpty();
        RuleFor(x => x.Cost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.GarageName).MaximumLength(200);
        RuleFor(x => x.MechanicName).MaximumLength(200);
        RuleFor(x => x.WorkStatus).IsInEnum();
    }
}
