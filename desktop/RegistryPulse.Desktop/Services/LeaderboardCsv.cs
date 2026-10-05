using System.Globalization;
using System.Text;
using System.Text.Json;

namespace RegistryPulse.Desktop.Services;

/// <summary>
/// Leaderboard CSV from a cached stats document. No window and no file dialog.
/// </summary>
internal static class LeaderboardCsv
{
    // Same formula-injection prefix as the dashboard page script: = + - @ tab CR.
    private const string FormulaPrefixChars = "=+-@\t\r";

    internal static string? FromStatsJson(byte[]? json)
    {
        if (json is null || json.Length == 0) return null;

        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException)
        {
            return null;
        }

        using (doc)
        {
            if (doc.RootElement.ValueKind != JsonValueKind.Object
                || !doc.RootElement.TryGetProperty("leaderboard", out var board)
                || board.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var lines = new List<string>();
            foreach (var row in board.EnumerateArray())
            {
                if (row.ValueKind != JsonValueKind.Object) continue;
                var rank = (lines.Count + 1).ToString(CultureInfo.InvariantCulture);
                lines.Add(string.Join(',', new[]
                {
                    Escape(rank),
                    Escape(Field(row, "name")),
                    Escape(Field(row, "registry")),
                    Escape(Field(row, "week")),
                    Escape(Field(row, "month")),
                    Escape(Field(row, "total")),
                    Escape(Trend(row)),
                }));
            }

            if (lines.Count == 0) return null;

            var csv = new StringBuilder();
            csv.Append(string.Join(',', new[]
            {
                Escape("Rank"),
                Escape("Package"),
                Escape("Registry"),
                Escape("Week"),
                Escape("Month"),
                Escape("Total"),
                Escape("Trend"),
            }));
            csv.Append('\n');
            foreach (var line in lines)
            {
                csv.Append(line);
                csv.Append('\n');
            }
            return csv.ToString();
        }
    }

    private static string Trend(JsonElement row)
    {
        if (!row.TryGetProperty("trendPct", out var value)
            || value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return "n/a";
        }

        return value.ValueKind == JsonValueKind.Number ? value.GetRawText() : "n/a";
    }

    private static string Field(JsonElement row, string property)
    {
        if (!row.TryGetProperty(property, out var value)
            || value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return "";
        }

        if (value.ValueKind == JsonValueKind.String)
            return value.GetString() ?? "";
        return value.GetRawText();
    }

    private static string Escape(string value)
    {
        if (value.Length > 0 && FormulaPrefixChars.Contains(value[0]))
            value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
    }
}
