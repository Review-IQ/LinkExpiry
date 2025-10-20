using System.Net.Http.Headers;
using System.Text;

namespace LinkExpiry.API.Services;

/// <summary>
/// Email service implementation using Mailgun API
/// </summary>
public class MailgunEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailgunEmailService> _logger;
    private readonly string _apiKey;
    private readonly string _domain;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly bool _isEnabled;

    public MailgunEmailService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MailgunEmailService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        _apiKey = _configuration["Mailgun:ApiKey"] ?? "";
        _domain = _configuration["Mailgun:Domain"] ?? "";
        _fromEmail = _configuration["Mailgun:FromEmail"] ?? "noreply@linkexpiry.com";
        _fromName = _configuration["Mailgun:FromName"] ?? "LinkExpiry";

        _isEnabled = !string.IsNullOrEmpty(_apiKey) && !string.IsNullOrEmpty(_domain);

        if (_isEnabled)
        {
            var authValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($"api:{_apiKey}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);
            _httpClient.BaseAddress = new Uri($"https://api.mailgun.net/v3/{_domain}/");
            _logger.LogInformation("Mailgun email service initialized for domain: {Domain}", _domain);
        }
        else
        {
            _logger.LogWarning("Mailgun email service is disabled. Configure ApiKey and Domain in appsettings.json");
        }
    }

    public async Task SendLinkExpiredNotificationAsync(
        string toEmail,
        string toName,
        string linkTitle,
        string shortCode,
        DateTime expiredAt)
    {
        if (!_isEnabled)
        {
            _logger.LogWarning("Attempted to send email but Mailgun is not configured");
            return;
        }

        var subject = $"Your link '{linkTitle}' has expired";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Link Expired</h1>
        </div>
        <div class=""content"">
            <p>Hi {toName},</p>
            <p>Your link <strong>{linkTitle}</strong> (/{shortCode}) has expired on {expiredAt:MMMM dd, yyyy} at {expiredAt:HH:mm} UTC.</p>
            <p>Visitors clicking this link will now see your custom expiry page (if configured) or a default expiry message.</p>
            <a href=""https://linkexpiry.com/dashboard/links"" class=""button"">View Your Links</a>
            <p>Want to create a new link? Simply log in to your dashboard and create one!</p>
        </div>
        <div class=""footer"">
            <p>© 2025 LinkExpiry. All rights reserved.</p>
            <p>You're receiving this because you enabled link expiry notifications.</p>
        </div>
    </div>
</body>
</html>";

        var textBody = $@"Hi {toName},

Your link '{linkTitle}' (/{shortCode}) has expired on {expiredAt:MMMM dd, yyyy} at {expiredAt:HH:mm} UTC.

Visitors clicking this link will now see your custom expiry page (if configured) or a default expiry message.

View your links: https://linkexpiry.com/dashboard/links

© 2025 LinkExpiry. All rights reserved.";

        await SendEmailAsync(toEmail, subject, htmlBody, textBody);
    }

    public async Task SendEmailCaptureConfirmationAsync(string toEmail, string linkTitle)
    {
        if (!_isEnabled)
        {
            _logger.LogWarning("Attempted to send email but Mailgun is not configured");
            return;
        }

        var subject = "Thank you for your interest!";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Thank You!</h1>
        </div>
        <div class=""content"">
            <p>Thank you for your interest in <strong>{linkTitle}</strong>.</p>
            <p>While this specific link has expired, we've captured your email and will keep you updated with future offers and content.</p>
            <p>Stay tuned!</p>
        </div>
        <div class=""footer"">
            <p>© 2025 LinkExpiry. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";

        var textBody = $@"Thank you for your interest in {linkTitle}!

While this specific link has expired, we've captured your email and will keep you updated with future offers and content.

Stay tuned!

© 2025 LinkExpiry. All rights reserved.";

        await SendEmailAsync(toEmail, subject, htmlBody, textBody);
    }

    public async Task SendWeeklyEmailCaptureReportAsync(
        string toEmail,
        string toName,
        int emailsCaptured,
        List<string> emails)
    {
        if (!_isEnabled)
        {
            _logger.LogWarning("Attempted to send email but Mailgun is not configured");
            return;
        }

        var emailList = string.Join("<br>", emails.Select(e => $"• {e}"));
        var subject = $"Weekly Report: {emailsCaptured} emails captured";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }}
        .stat {{ background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4f46e5; }}
        .email-list {{ background: white; padding: 15px; margin: 15px 0; border-radius: 5px; max-height: 200px; overflow-y: auto; }}
        .button {{ display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Weekly Email Capture Report</h1>
        </div>
        <div class=""content"">
            <p>Hi {toName},</p>
            <p>Here's your weekly summary of email captures from expired links:</p>
            <div class=""stat"">
                <h2 style=""margin: 0; color: #4f46e5;"">{emailsCaptured}</h2>
                <p style=""margin: 5px 0 0 0; color: #6b7280;"">Emails Captured This Week</p>
            </div>
            <p><strong>Captured Emails:</strong></p>
            <div class=""email-list"">
                {emailList}
            </div>
            <a href=""https://linkexpiry.com/dashboard/analytics"" class=""button"">View Full Analytics</a>
        </div>
        <div class=""footer"">
            <p>© 2025 LinkExpiry. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";

        var textBody = $@"Hi {toName},

Weekly Email Capture Report
===========================

Emails Captured This Week: {emailsCaptured}

Captured Emails:
{string.Join("\n", emails.Select(e => $"• {e}"))}

View full analytics: https://linkexpiry.com/dashboard/analytics

© 2025 LinkExpiry. All rights reserved.";

        await SendEmailAsync(toEmail, subject, htmlBody, textBody);
    }

    public async Task SendTestEmailAsync(string toEmail)
    {
        if (!_isEnabled)
        {
            _logger.LogWarning("Attempted to send test email but Mailgun is not configured");
            return;
        }

        var subject = "LinkExpiry Test Email";
        var htmlBody = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>✅ Email Service Working!</h1>
        </div>
        <p>This is a test email from your LinkExpiry application.</p>
        <p>If you're seeing this, your Mailgun configuration is working correctly.</p>
    </div>
</body>
</html>";

        var textBody = "✅ Email Service Working!\n\nThis is a test email from your LinkExpiry application.\n\nIf you're seeing this, your Mailgun configuration is working correctly.";

        await SendEmailAsync(toEmail, subject, htmlBody, textBody);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody, string textBody)
    {
        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "from", $"{_fromName} <{_fromEmail}>" },
                { "to", to },
                { "subject", subject },
                { "html", htmlBody },
                { "text", textBody }
            });

            var response = await _httpClient.PostAsync("messages", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {To} with subject: {Subject}", to, subject);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send email to {To}. Status: {Status}, Error: {Error}",
                    to, response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception sending email to {To}", to);
        }
    }
}
