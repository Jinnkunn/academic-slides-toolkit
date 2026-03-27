# Academic Slides Toolkit

`Academic Slides Toolkit` is an early-stage Figma Slides plugin for building research, teaching, and technical presentation decks with more structure than a generic slide workflow.

Today, the project already includes usable template-region deck sync tooling and a first equation workflow. The broader goal is to grow it into a full academic presentation toolkit with equations, captions, references, and reusable academic blocks.

## Status

This repository is currently a working prototype, not a finished product.

Implemented now:

- Save a header, footer, or custom region as a reusable template in Figma Slides
- Choose anchor-based placement presets such as top center, bottom right, or custom position
- Optionally align templates to a configurable safe area instead of raw slide edges
- Reorder managed template regions deterministically and report overlap conflicts during sync
- Auto-generate page numbers from a selected text node
- Apply or sync a template region across slides
- Exclude slides and control numbering start
- Bind template text as content sources and map them to source slides by page range
- Insert LaTeX equations with inline or display mode
- Re-edit plugin-created equations
- Batch number display equations on the current slide or across the deck
- Switch the plugin UI between Chinese and English

Planned next:

- Figure and table blocks with caption management
- Theorem, lemma, definition, and proof components
- References and bibliography workflows
- Consistency checks across a full academic deck

## Why This Exists

Academic slide decks have different needs from generic presentation tools:

- equations need to stay editable
- figures and tables need consistent captioning
- section titles and deck metadata need to stay in sync
- repeated academic layouts should be faster to build

This project started from a footer-sync plugin and is being expanded into a broader toolkit for academic presentations inside Figma Slides.

## Install Locally

1. Open Figma.
2. Go to `Plugins` -> `Development` -> `Import plugin from manifest...`
3. Select [`manifest.json`](/Users/jinnkunn/Desktop/Figma-Academic-Slides/manifest.json).
4. Open a Figma Slides file and run the imported plugin.

Notes:

- The plugin now uses the in-product name `Academic Slides Toolkit`.
- The plugin manifest `id` is now `academic-slides-toolkit`.
- If you previously imported this project under `footer-sync-slides`, Figma will treat this as a new plugin identity. Existing `clientStorage` data and plugin-private metadata from the old id will not automatically carry over.

## Usage

### Deck workflow

1. Select a header, footer, or custom region on a slide.
2. Save it as a template and choose its anchor placement and layout area.
3. Optionally bind text layers inside the template as syncable content sources.
4. Configure excluded slides and page-number start.
5. Apply or sync the template across the deck.

### Equation workflow

1. Open the `Equations` module.
2. Enter LaTeX and preview the rendered result.
3. Insert the equation as inline or display mode.
4. Re-select a plugin-created equation to update or delete it.
5. Use the numbering panel to generate or clear equation labels.

## Project Structure

- [`manifest.json`](/Users/jinnkunn/Desktop/Figma-Academic-Slides/manifest.json): Figma plugin manifest
- [`code.js`](/Users/jinnkunn/Desktop/Figma-Academic-Slides/code.js): plugin runtime logic
- [`ui.html`](/Users/jinnkunn/Desktop/Figma-Academic-Slides/ui.html): sidebar UI
- [`docs/academic-slides-toolkit-plan.md`](/Users/jinnkunn/Desktop/Figma-Academic-Slides/docs/academic-slides-toolkit-plan.md): product direction and roadmap

## Development

This plugin is currently implemented as a simple Figma plugin without a build step:

- plain JavaScript for plugin logic
- plain HTML/CSS/JavaScript for the UI
- `clientStorage` for saved templates and settings

That keeps iteration fast while the product direction is still evolving.

## Roadmap Reference

For the longer-term product plan, see [`docs/academic-slides-toolkit-plan.md`](/Users/jinnkunn/Desktop/Figma-Academic-Slides/docs/academic-slides-toolkit-plan.md).
