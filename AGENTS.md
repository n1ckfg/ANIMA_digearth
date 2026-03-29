# AGENTS.md

## Project Overview

ANIMA_digearth is a digital archaeology/preservation project for "Digital Earth," a significant 1990s-era digital art and hypertext project from Vancouver. This is a historical digital humanities archive, not a traditional software project.

## Repository Structure

- **Root & subdirectories**: ~934 HTML files containing archived 1990s web art, artist portfolios, hypertext essays, and experimental navigation structures
- **Artist directories**: alex/, antonia/, b/, diss/, doing_time/, ggarvey/, lee/, tom/, zainub/, Claude/, lena/, etc.
- **Transverse Worlds Volume Two of Digital Earth/**: Extended archive with additional works and VRML 3D worlds
- **css/**: Generated stylesheet directory (created by link validation script)
- **Media**: Original GIFs, JPEGs, MOV videos, DCR Director files, and VRML worlds (.wrl) from 1996-1999

## Historical Context

Original URLs (now defunct):
- http://www.digearth.bcit.bc.ca/dedocs
- http://www.digitalearth.org

Internet Archive snapshots available at web.archive.org (see README.txt for specific URLs).

## Development Commands

### Mark broken links across all HTML files
```bash
./mark-broken-links.sh [directory]
```
This script:
1. Creates `css/main.css` with `.broken { color: red; }` styling
2. Injects CSS link references into all HTML files with correct relative paths
3. Uses Python 3 to validate both local file references and external HTTP/HTTPS URLs
4. Marks broken links with `class="broken"` for visual identification
5. Reports broken link statistics

Note: Shell scripts are gitignored (*.sh in .gitignore).

## Working with Archive Content

- HTML files use 1990s conventions: tables for layout, inline styling, GIF images
- Many external links are intentionally broken (archived from defunct 1990s sites)
- Preserve original HTML structure and formatting when possible
- The `broken` class on links indicates validated dead links, not errors to fix
