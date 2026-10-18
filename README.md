# alanpetersen.github.io

Personal site. GitHub Pages serves this repository from the root of `main`.

Profile copy and the project list both live in [`data/site.json`](data/site.json). The layout, type, and project pages are generated from that file. Push a change to `main` and the site updates.

## Change the intro

Edit the fields at the top of `data/site.json`:

| Field | What it does |
| --- | --- |
| `name` | Masthead and the page title |
| `role`, `org`, `place` | The line under the headline. Leave any of them blank to hide it. |
| `headline` | The large line. A trailing period is drawn in copper. |
| `summary` | The short paragraph under the headline |
| `links` | `{ "label", "href" }` pairs in the masthead |

## Add a project

Add an object to the `projects` array:

```json
{
  "slug": "short-name",
  "title": "Project title",
  "year": "2026",
  "status": "building",
  "kind": "tool",
  "featured": true,
  "summary": "One or two sentences for the card.",
  "detail": [
    "Longer paragraphs for the project page.",
    "Each string is its own paragraph."
  ],
  "tags": ["Salesforce", "CLI"],
  "links": [
    { "label": "Source", "href": "https://github.com/alanpetersen/example" }
  ]
}
```

- `slug` becomes the link: `https://alanpetersen.github.io/#short-name`. Use lowercase letters, numbers, and hyphens. Avoid the slug `home`.
- `summary` is the card text. `detail` is the project page. A string works for `detail` if you only need one paragraph.
- `status` is `building`, `shipped`, `talk`, or `archive`. Archive entries sit in the quieter Earlier list.
- `kind` is `tool`, `app`, `talk`, `writing`, or `other`. The filters use this.
- `featured` makes the card full width and sorts it first.
- `image` is an optional path such as `images/cover.jpg`. Put the file in the repo.
- `page` is an optional path to your own HTML, such as `projects/short-name/`, when the generated page is not enough. That page needs its own link back to `/`.

The sample entries are there so the layout has something to show. Delete them when you add real work.

## Preview

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. The page loads `data/site.json` with `fetch`, so open it through a local server rather than as a file on disk.

## Publish

Push to `main`. Under Settings → Pages, deploy from the `main` branch and the `/` folder.

`.nojekyll` tells GitHub Pages to serve the files as they are, with no Jekyll build.
