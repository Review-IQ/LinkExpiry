// Quick test to verify BCrypt hashing
// Run with: dotnet script test-bcrypt.csx

#r "nuget: BCrypt.Net-Next, 4.0.3"

using BCrypt.Net;

var password = "123456";
var hash = "$2a$11$BcR6.pSrFPSpdkODaiYsdegszsrHTSu55P2NRYJk/LTu4PsOcXU.2";

Console.WriteLine($"Testing password: {password}");
Console.WriteLine($"Against hash: {hash}");
Console.WriteLine();

var result = BCrypt.Net.BCrypt.Verify(password, hash);
Console.WriteLine($"Verification result: {result}");

if (!result)
{
    Console.WriteLine("\nLet's test creating a new hash:");
    var newHash = BCrypt.Net.BCrypt.HashPassword(password);
    Console.WriteLine($"New hash: {newHash}");

    var verifyNew = BCrypt.Net.BCrypt.Verify(password, newHash);
    Console.WriteLine($"New hash verifies: {verifyNew}");
}
