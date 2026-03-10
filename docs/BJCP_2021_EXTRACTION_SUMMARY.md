# BJCP 2021 Extraction Summary

- Source DOCX: `docs/2021_Guidelines_Beer_1.25.docx`
- Source Markdown: `docs/BJCP_2021_GUIDELINES.md`
- Extracted CSV: `docs/BJCP_2021_STYLES_EXTRACT.csv`
- Total styles discovered: 102
- Styles with parsed vital statistics: 84
- Styles needing review: 18

## Notes
- The DOCX was normalized with Pandoc before extraction.
- The parser currently targets beer style headings and the standardized Vital Statistics block.
- Specialty entries with non-numeric or non-standard vital statistics should be reviewed manually during Phase 1 seed implementation.
- The `description` column is currently seeded from the Overall Impression section when available.

## Styles needing manual review
- 23F Fruit Lambic
- 28A Brett Beer
- 28B Mixed-Fermentation Sour Beer
- 28C Wild Specialty Beer
- 29A Fruit Beer
- 29B Fruit and Spice Beer
- 29C Specialty Fruit Beer
- 30A Spice, Herb, or Vegetable Beer
- 30B Autumn Seasonal Beer
- 30C Winter Seasonal Beer
- 30D Specialty Spice Beer
- 31A Alternative Grain Beer
- 32A Classic Style Smoked Beer
- 32B Specialty Smoked Beer
- 33A Wood-Aged Beer
- 33B Specialty Wood-Aged Beer
- 34A Commercial Specialty Beer
- 34B Mixed-Style Beer
