# Test BCrypt password verification
# This will help us understand if the hash is valid

$code = @"
using System;

class Program
{
    static void Main()
    {
        var password = "123456";
        var hash = "$2a$11$BcR6.pSrFPSpdkODaiYsdegszsrHTSu55P2NRYJk/LTu4PsOcXU.2";

        Console.WriteLine($"Testing password: '{password}'");
        Console.WriteLine($"Against hash: {hash}");
        Console.WriteLine($"Hash length: {hash.Length}");
        Console.WriteLine();

        try
        {
            var result = BCrypt.Net.BCrypt.Verify(password, hash);
            Console.WriteLine($"Verification result: {result}");

            if (!result)
            {
                Console.WriteLine("\nTesting hash creation:");
                var newHash = BCrypt.Net.BCrypt.HashPassword(password);
                Console.WriteLine($"New hash for '123456': {newHash}");

                var verifyNew = BCrypt.Net.BCrypt.Verify(password, newHash);
                Console.WriteLine($"New hash verifies: {verifyNew}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
        }
    }
}
"@

# Write temp C# file
$tempFile = [System.IO.Path]::GetTempFileName() + ".cs"
Set-Content -Path $tempFile -Value $code

# Compile and run
Write-Host "Compiling test program..." -ForegroundColor Yellow
dotnet-script eval "$code" 2>&1

Remove-Item $tempFile -ErrorAction SilentlyContinue
