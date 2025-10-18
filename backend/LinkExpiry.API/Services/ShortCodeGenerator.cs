using LinkExpiry.API.Data;
using System.Text;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service for generating unique short codes for links
/// Uses Base62 encoding (0-9, a-z, A-Z) for URL-friendly codes
/// </summary>
public class ShortCodeGenerator
{
    private const string Base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const int ShortCodeLength = 7;
    private const int MaxRetries = 3;

    // Profanity filter - basic list (expand as needed)
    private static readonly HashSet<string> Blacklist = new(StringComparer.OrdinalIgnoreCase)
    {
        "fuck", "shit", "damn", "hell", "bitch", "ass", "bastard",
        "porn", "sex", "xxx", "nazi", "kill", "die", "hate"
    };

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ShortCodeGenerator> _logger;
    private readonly Random _random = new();

    public ShortCodeGenerator(IUnitOfWork unitOfWork, ILogger<ShortCodeGenerator> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Generate a unique short code with collision checking
    /// </summary>
    /// <returns>Unique 7-character short code</returns>
    public async Task<string> GenerateUniqueCodeAsync()
    {
        for (int attempt = 0; attempt < MaxRetries; attempt++)
        {
            var code = GenerateRandomCode();

            // Check if code passes profanity filter
            if (ContainsProfanity(code))
            {
                _logger.LogDebug("Generated code contains profanity, regenerating");
                continue;
            }

            // Check for collision in database
            var exists = await _unitOfWork.Links
                .FirstOrDefaultAsync(l => l.ShortCode == code);

            if (exists == null)
            {
                _logger.LogDebug("Generated unique short code: {Code}", code);
                return code;
            }

            _logger.LogDebug("Short code collision detected on attempt {Attempt}", attempt + 1);
        }

        throw new InvalidOperationException(
            $"Failed to generate unique short code after {MaxRetries} attempts");
    }

    /// <summary>
    /// Generate a random Base62 short code
    /// </summary>
    private string GenerateRandomCode()
    {
        var code = new StringBuilder(ShortCodeLength);

        lock (_random)
        {
            for (int i = 0; i < ShortCodeLength; i++)
            {
                code.Append(Base62Chars[_random.Next(Base62Chars.Length)]);
            }
        }

        return code.ToString();
    }

    /// <summary>
    /// Check if code contains blacklisted words
    /// </summary>
    private bool ContainsProfanity(string code)
    {
        var lowerCode = code.ToLower();

        foreach (var word in Blacklist)
        {
            if (lowerCode.Contains(word))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Validate short code format
    /// </summary>
    public bool IsValidShortCode(string code)
    {
        if (string.IsNullOrEmpty(code) || code.Length != ShortCodeLength)
        {
            return false;
        }

        foreach (char c in code)
        {
            if (!Base62Chars.Contains(c))
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Generate short code from timestamp and random data (alternative method)
    /// </summary>
    public string GenerateTimestampBasedCode()
    {
        // Use timestamp + random for better distribution
        var timestamp = DateTime.UtcNow.Ticks;
        var randomPart = _random.Next(0, 999999);
        var combined = timestamp + randomPart;

        return EncodeBase62(combined);
    }

    /// <summary>
    /// Encode a number to Base62 string
    /// </summary>
    private string EncodeBase62(long number)
    {
        if (number == 0)
            return Base62Chars[0].ToString();

        var result = new StringBuilder();

        while (number > 0)
        {
            result.Insert(0, Base62Chars[(int)(number % 62)]);
            number /= 62;
        }

        // Pad or truncate to desired length
        if (result.Length < ShortCodeLength)
        {
            while (result.Length < ShortCodeLength)
            {
                result.Insert(0, Base62Chars[_random.Next(Base62Chars.Length)]);
            }
        }
        else if (result.Length > ShortCodeLength)
        {
            result.Length = ShortCodeLength;
        }

        return result.ToString();
    }
}
