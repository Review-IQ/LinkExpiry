using LinkExpiry.API.Models.Responses;
using System.Net;
using System.Text.Json;

namespace LinkExpiry.API.Middleware;

/// <summary>
/// Global exception handling middleware
/// Catches all unhandled exceptions and returns standardized error responses
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception switch
        {
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "Unauthorized access",
                new List<string> { exception.Message }
            ),
            ArgumentException => (
                HttpStatusCode.BadRequest,
                "Invalid argument",
                new List<string> { exception.Message }
            ),
            InvalidOperationException => (
                HttpStatusCode.BadRequest,
                "Invalid operation",
                new List<string> { exception.Message }
            ),
            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "Resource not found",
                new List<string> { exception.Message }
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "An error occurred while processing your request",
                _environment.IsDevelopment()
                    ? new List<string> { exception.Message, exception.StackTrace ?? string.Empty }
                    : new List<string>()
            )
        };

        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse.ErrorResponse(message, errors);

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}
