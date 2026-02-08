using AutoMapper;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Security;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Auth;
using Helium.Application.Models.Users;
using Helium.Domain.Entities;

namespace Helium.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IMapper _mapper;

    public AuthService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _mapper = mapper;
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var userRepo = _unitOfWork.Repository<User>();
        var exists = userRepo.Query().Any(u => u.Email.ToLower() == request.Email.ToLower());
        if (exists)
        {
            throw new InvalidOperationException("Email already registered.");
        }

        var (hash, salt) = _passwordHasher.HashPassword(request.Password);
        var user = new User
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = hash,
            PasswordSalt = salt,
            PreferredCurrency = request.PreferredCurrency
        };

        await userRepo.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResultDto
        {
            Token = _jwtTokenService.GenerateToken(new UserTokenPayload { UserId = user.Id, Email = user.Email }),
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<AuthResultDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var userRepo = _unitOfWork.Repository<User>();
        var user = userRepo.Query().FirstOrDefault(u => u.Email.ToLower() == request.Email.ToLower());
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        return await Task.FromResult(new AuthResultDto
        {
            Token = _jwtTokenService.GenerateToken(new UserTokenPayload { UserId = user.Id, Email = user.Email }),
            User = _mapper.Map<UserDto>(user)
        });
    }
}
