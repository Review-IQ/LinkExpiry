namespace LinkExpiry.API.Services;

/// <summary>
/// Service interface for sending emails
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Send link expiry notification to link owner
    /// </summary>
    Task SendLinkExpiredNotificationAsync(string toEmail, string toName, string linkTitle, string shortCode, DateTime expiredAt);

    /// <summary>
    /// Send email capture confirmation to visitor
    /// </summary>
    Task SendEmailCaptureConfirmationAsync(string toEmail, string linkTitle);

    /// <summary>
    /// Send weekly report of captured emails to link owner
    /// </summary>
    Task SendWeeklyEmailCaptureReportAsync(string toEmail, string toName, int emailsCaptured, List<string> emails);

    /// <summary>
    /// Send test email to verify configuration
    /// </summary>
    Task SendTestEmailAsync(string toEmail);
}
