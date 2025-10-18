namespace LinkExpiry.API.Constants;

/// <summary>
/// Defines the limits for each subscription plan
/// </summary>
public static class PlanLimits
{
    /// <summary>
    /// Plan types
    /// </summary>
    public static class PlanTypes
    {
        public const string Free = "FREE";
        public const string Starter = "STARTER";
        public const string Pro = "PRO";
        public const string Enterprise = "ENTERPRISE";
    }

    /// <summary>
    /// Monthly link creation limits by plan
    /// </summary>
    public static class MonthlyLinkLimits
    {
        public const int Free = 5;
        public const int Starter = 50;
        public const int Pro = 500;
        public const int Enterprise = int.MaxValue; // Unlimited
    }

    /// <summary>
    /// Max views per link by plan (view limit when creating a link)
    /// </summary>
    public static class MaxViewsPerLink
    {
        public const int Free = 100;
        public const int Starter = 100;
        public const int Pro = int.MaxValue; // Unlimited
        public const int Enterprise = int.MaxValue; // Unlimited
    }

    /// <summary>
    /// Get monthly link limit for a plan
    /// </summary>
    public static int GetMonthlyLinkLimit(string planType)
    {
        return planType?.ToUpper() switch
        {
            PlanTypes.Free => MonthlyLinkLimits.Free,
            PlanTypes.Starter => MonthlyLinkLimits.Starter,
            PlanTypes.Pro => MonthlyLinkLimits.Pro,
            PlanTypes.Enterprise => MonthlyLinkLimits.Enterprise,
            _ => MonthlyLinkLimits.Free
        };
    }

    /// <summary>
    /// Get max views per link limit for a plan
    /// </summary>
    public static int GetMaxViewsPerLink(string planType)
    {
        return planType?.ToUpper() switch
        {
            PlanTypes.Free => MaxViewsPerLink.Free,
            PlanTypes.Starter => MaxViewsPerLink.Starter,
            PlanTypes.Pro => MaxViewsPerLink.Pro,
            PlanTypes.Enterprise => MaxViewsPerLink.Enterprise,
            _ => MaxViewsPerLink.Free
        };
    }

    /// <summary>
    /// Check if a plan has email notifications enabled
    /// </summary>
    public static bool HasEmailNotifications(string planType)
    {
        return planType?.ToUpper() switch
        {
            PlanTypes.Free => false,
            PlanTypes.Starter => true,
            PlanTypes.Pro => true,
            PlanTypes.Enterprise => true,
            _ => false
        };
    }

    /// <summary>
    /// Check if a plan has advanced analytics
    /// </summary>
    public static bool HasAdvancedAnalytics(string planType)
    {
        return planType?.ToUpper() switch
        {
            PlanTypes.Free => false,
            PlanTypes.Starter => false,
            PlanTypes.Pro => true,
            PlanTypes.Enterprise => true,
            _ => false
        };
    }

    /// <summary>
    /// Get plan display name
    /// </summary>
    public static string GetPlanDisplayName(string planType)
    {
        return planType?.ToUpper() switch
        {
            PlanTypes.Free => "Free",
            PlanTypes.Starter => "Starter ($5/month)",
            PlanTypes.Pro => "Pro ($29/month)",
            PlanTypes.Enterprise => "Enterprise ($99/month)",
            _ => "Free"
        };
    }
}
