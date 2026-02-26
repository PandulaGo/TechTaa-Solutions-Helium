using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Helium.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleBodyAndPowertrainTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename existing Type column to PowertrainType
            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Vehicles",
                newName: "PowertrainType");

            // Add new BodyType column (default to Car = 0 for existing rows)
            migrationBuilder.AddColumn<int>(
                name: "BodyType",
                table: "Vehicles",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop BodyType column
            migrationBuilder.DropColumn(
                name: "BodyType",
                table: "Vehicles");

            // Rename PowertrainType back to Type
            migrationBuilder.RenameColumn(
                name: "PowertrainType",
                table: "Vehicles",
                newName: "Type");
        }
    }
}
