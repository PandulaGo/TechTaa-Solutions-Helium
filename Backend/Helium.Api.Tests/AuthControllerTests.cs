using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace Helium.Api.Tests
{
    public class AuthControllerTests
    {
        [Fact]
        public async Task Register_ShouldReturnSuccess_WhenValidRequest()
        {
            // Arrange
            var client = new HttpClient();
            var request = new
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Password = "Password1!",
                PreferredCurrency = "USD"
            };

            // Act
            var response = await client.PostAsJsonAsync("http://localhost:10011/api/auth/register", request);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.True(response.IsSuccessStatusCode, $"Response: {content}");
        }
    }
}
