param(
    [string]$MarkdownPath = (Join-Path $PSScriptRoot "..\docs\BJCP_2021_GUIDELINES.md"),
    [string]$CsvPath = (Join-Path $PSScriptRoot "..\docs\BJCP_2021_STYLES_EXTRACT.csv"),
    [string]$SummaryPath = (Join-Path $PSScriptRoot "..\docs\BJCP_2021_EXTRACTION_SUMMARY.md")
)

function Format-Whitespace {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }

    return (($Value -replace '\s+', ' ').Trim())
}

function Get-VitalStatistics {
    param([string]$Block)

    $normalized = $Block -replace "`r?`n", ' '
    $normalized = $normalized -replace '\*', ''
    $normalized = $normalized -replace '\\', ' '
    $normalized = $normalized -replace '–', '-'
    $normalized = Format-Whitespace $normalized

    $pattern = 'Vital Statistics:\s*OG:\s*([0-9.]+)\s*-\s*([0-9.]+)\s*IBUs:\s*([0-9.]+)\s*-\s*([0-9.]+)\s*FG:\s*([0-9.]+)\s*-\s*([0-9.]+)\s*SRM:\s*([0-9.]+)\s*-\s*([0-9.]+)\s*ABV:\s*([0-9.]+)\s*-\s*([0-9.]+)%'
    $match = [regex]::Match($normalized, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    if (-not $match.Success) {
        return $null
    }

    return [pscustomobject]@{
        og_min  = $match.Groups[1].Value
        og_max  = $match.Groups[2].Value
        ibu_min = $match.Groups[3].Value
        ibu_max = $match.Groups[4].Value
        fg_min  = $match.Groups[5].Value
        fg_max  = $match.Groups[6].Value
        srm_min = $match.Groups[7].Value
        srm_max = $match.Groups[8].Value
        abv_min = $match.Groups[9].Value
        abv_max = $match.Groups[10].Value
    }
}

if (-not (Test-Path $MarkdownPath)) {
    throw "Markdown source not found: $MarkdownPath"
}

$lines = Get-Content -LiteralPath $MarkdownPath
$styles = New-Object System.Collections.Generic.List[object]
$currentCategoryName = $null
$currentStyle = $null
$currentBuffer = New-Object System.Collections.Generic.List[string]

function Save-CurrentStyle {
    param(
        [object]$Style,
        [System.Collections.Generic.List[string]]$Buffer,
        [System.Collections.Generic.List[object]]$Output
    )

    if ($null -eq $Style) {
        return
    }

    $block = ($Buffer -join "`n")
    $vitals = Get-VitalStatistics -Block $block
    $descriptionMatch = [regex]::Match(($block -replace "`r?`n", ' '), 'Overall Impression:\s*(.+?)(?=\s*[A-Z][A-Za-z /-]+:|\s*Vital Statistics:)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $description = if ($descriptionMatch.Success) { Format-Whitespace $descriptionMatch.Groups[1].Value } else { '' }

    $Output.Add([pscustomobject]@{
        category_number     = $Style.category_number
        subcategory_letter  = $Style.subcategory_letter
        category_name       = $Style.category_name
        style_name          = $Style.style_name
        og_min              = if ($vitals) { $vitals.og_min } else { '' }
        og_max              = if ($vitals) { $vitals.og_max } else { '' }
        fg_min              = if ($vitals) { $vitals.fg_min } else { '' }
        fg_max              = if ($vitals) { $vitals.fg_max } else { '' }
        ibu_min             = if ($vitals) { $vitals.ibu_min } else { '' }
        ibu_max             = if ($vitals) { $vitals.ibu_max } else { '' }
        srm_min             = if ($vitals) { $vitals.srm_min } else { '' }
        srm_max             = if ($vitals) { $vitals.srm_max } else { '' }
        abv_min             = if ($vitals) { $vitals.abv_min } else { '' }
        abv_max             = if ($vitals) { $vitals.abv_max } else { '' }
        description         = $description
        extraction_status   = if ($vitals) { 'parsed' } else { 'review' }
        source_markdown     = (Split-Path -Leaf $MarkdownPath)
    })
}

foreach ($line in $lines) {
    if ($line -match '^#\s+(\d+)\.\s+(.+?)\s*$') {
        Save-CurrentStyle -Style $currentStyle -Buffer $currentBuffer -Output $styles
        $currentStyle = $null
        $currentBuffer = New-Object System.Collections.Generic.List[string]
        $currentCategoryName = Format-Whitespace $matches[2]
        continue
    }

    if ($line -match '^##\s+(\d+)([A-Z]+)\.\s+(.+?)\s*$') {
        Save-CurrentStyle -Style $currentStyle -Buffer $currentBuffer -Output $styles
        $currentBuffer = New-Object System.Collections.Generic.List[string]
        $currentStyle = [pscustomobject]@{
            category_number    = $matches[1]
            subcategory_letter = $matches[2]
            category_name      = $currentCategoryName
            style_name         = Format-Whitespace $matches[3]
        }
        continue
    }

    if ($null -ne $currentStyle) {
        $currentBuffer.Add($line)
    }
}

Save-CurrentStyle -Style $currentStyle -Buffer $currentBuffer -Output $styles

$styles | Export-Csv -LiteralPath $CsvPath -NoTypeInformation -Encoding UTF8

$parsedCount = @($styles | Where-Object { $_.extraction_status -eq 'parsed' }).Count
$reviewItems = @($styles | Where-Object { $_.extraction_status -eq 'review' })

$summaryLines = @(
    '# BJCP 2021 Extraction Summary',
    '',
    '- Source DOCX: `docs/2021_Guidelines_Beer_1.25.docx`',
    '- Source Markdown: `docs/BJCP_2021_GUIDELINES.md`',
    '- Extracted CSV: `docs/BJCP_2021_STYLES_EXTRACT.csv`',
    "- Total styles discovered: $($styles.Count)",
    "- Styles with parsed vital statistics: $parsedCount",
    "- Styles needing review: $($reviewItems.Count)",
    '',
    '## Notes',
    '- The DOCX was normalized with Pandoc before extraction.',
    '- The parser currently targets beer style headings and the standardized Vital Statistics block.',
    '- Specialty entries with non-numeric or non-standard vital statistics should be reviewed manually during Phase 1 seed implementation.',
    '- The `description` column is currently seeded from the Overall Impression section when available.',
    ''
)

if ($reviewItems.Count -gt 0) {
    $summaryLines += '## Styles needing manual review'
    foreach ($item in $reviewItems) {
        $summaryLines += "- $($item.category_number)$($item.subcategory_letter) $($item.style_name)"
    }
}

Set-Content -LiteralPath $SummaryPath -Value ($summaryLines -join "`r`n") -Encoding UTF8

Write-Output "Extracted $($styles.Count) styles to $CsvPath"
Write-Output "Summary written to $SummaryPath"
