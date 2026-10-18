// Renders data/site.json. Add projects there.

const FILTERS = [
  { id: "all", label: "All" },
  { id: "tool", label: "Tools" },
  { id: "app", label: "Apps" },
  { id: "talk", label: "Talks" },
  { id: "archive", label: "Earlier" }
];

const STATUS_LABELS = {
  building: "Building",
  shipped: "Shipped",
  talk: "Talk",
  archive: "Archive"
};

let profile = {};
let projects = [];
let activeFilter = "all";
let intro;
let work;
let detail;
let catalog;

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  const list = children == null ? [] : Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function normalize(raw) {
  if (!raw || typeof raw !== "object" || !raw.slug || !raw.title) return null;
  const detail = Array.isArray(raw.detail)
    ? raw.detail.map(String).filter(Boolean)
    : raw.detail
      ? [String(raw.detail)]
      : [];
  return {
    slug: String(raw.slug),
    title: String(raw.title),
    summary: raw.summary ? String(raw.summary) : detail[0] || "",
    detail,
    year: raw.year ? String(raw.year) : "",
    status: raw.status || "building",
    kind: raw.kind || "other",
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).filter(Boolean) : [],
    links: Array.isArray(raw.links) ? raw.links.filter((link) => link && link.href && link.label) : [],
    featured: Boolean(raw.featured),
    image: raw.image ? String(raw.image) : "",
    page: raw.page ? String(raw.page) : ""
  };
}

function compareProjects(a, b) {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.year !== b.year) return a.year < b.year ? 1 : -1;
  return a.title.localeCompare(b.title);
}

function projectHref(project) {
  return project.page || `#${encodeURIComponent(project.slug)}`;
}

function stamp(status) {
  return el("span", { class: "stamp", "data-status": status }, STATUS_LABELS[status] || status);
}

function tagList(tags) {
  if (!tags.length) return null;
  return el("ul", { class: "tags" }, tags.map((tag) => el("li", {}, tag)));
}

function externalAttrs(href) {
  return /^https?:\/\//.test(href)
    ? { target: "_blank", rel: "noreferrer noopener", class: "external" }
    : {};
}

function headlineNode(text) {
  const heading = el("h1", { class: "headline", "aria-label": text });
  if (text.endsWith(".")) {
    heading.append(text.slice(0, -1), el("span", { class: "dot" }, "."));
  } else {
    heading.textContent = text;
  }
  return heading;
}

function renderMasthead() {
  const nav = el("nav", { class: "links", "aria-label": "Elsewhere" });
  for (const link of profile.links || []) {
    nav.append(el("a", { href: link.href, ...externalAttrs(link.href) }, link.label));
  }
  return [el("a", { class: "name", href: "#home" }, profile.name || "Portfolio"), nav];
}

function renderIntro() {
  const section = el("section", { class: "intro" });
  section.append(headlineNode(profile.headline || profile.name || "Portfolio"));
  const meta = [profile.role, profile.org, profile.place].filter(Boolean);
  if (meta.length) section.append(el("p", { class: "meta" }, meta.join(" · ")));
  if (profile.summary) section.append(el("p", { class: "summary" }, profile.summary));
  return section;
}

function renderFilters() {
  const nav = el("div", { class: "filters", role: "toolbar", "aria-label": "Filter projects" });
  for (const filter of FILTERS) {
    const button = el("button", {
      type: "button",
      class: "filter",
      "aria-pressed": filter.id === activeFilter ? "true" : "false"
    }, filter.label);
    button.addEventListener("click", () => {
      activeFilter = filter.id;
      for (const other of nav.querySelectorAll(".filter")) {
        other.setAttribute("aria-pressed", String(other === button));
      }
      if (location.hash && location.hash !== "#home") location.hash = "home";
      else renderCatalog();
    });
    nav.append(button);
  }
  return nav;
}

function renderWork() {
  const section = el("section", { class: "work", id: "work" });
  catalog = el("div", { id: "catalog", "aria-live": "polite" });
  section.append(
    el("div", { class: "work-head" }, [
      el("h2", { class: "work-title" }, "Work"),
      renderFilters()
    ]),
    catalog
  );
  return section;
}

function renderFooter() {
  const bits = [profile.name, profile.place, String(new Date().getFullYear())].filter(Boolean);
  return el("p", {}, bits.join(" · "));
}

function renderCard(project, index) {
  const card = el("a", {
    class: project.featured ? "card featured" : "card",
    href: projectHref(project)
  });
  if (project.image) card.append(el("img", { class: "card-image", src: project.image, alt: "" }));
  const meta = el("div", { class: "card-meta" }, [
    el("span", { class: "num" }, String(index + 1).padStart(2, "0")),
    stamp(project.status)
  ]);
  if (project.year) meta.append(el("span", { class: "year" }, project.year));
  card.append(meta, el("h3", {}, project.title));
  if (project.summary) card.append(el("p", { class: "card-summary" }, project.summary));
  const tags = tagList(project.tags);
  if (tags) card.append(tags);
  return card;
}

function renderRow(project) {
  return el("a", { class: "row", href: projectHref(project) }, [
    el("span", { class: "year" }, project.year || "—"),
    el("span", { class: "row-body" }, [
      el("span", { class: "row-title" }, project.title),
      project.summary ? el("span", { class: "row-summary" }, project.summary) : null
    ]),
    stamp(project.status)
  ]);
}

function cardGrid(items) {
  return el("div", { class: "grid" }, items.map(renderCard));
}

function rowList(items) {
  return el("div", { class: "rows" }, items.map(renderRow));
}

function emptyState() {
  return el("p", { class: "empty" }, "Nothing in this view yet.");
}

function sectionLabel(text) {
  return el("h3", { class: "section-label" }, text);
}

function viewProjects() {
  const list = projects.slice().sort(compareProjects);
  if (activeFilter === "all") {
    return {
      mode: "split",
      current: list.filter((project) => project.status !== "archive"),
      earlier: list.filter((project) => project.status === "archive")
    };
  }
  if (activeFilter === "archive") {
    return { mode: "rows", items: list.filter((project) => project.status === "archive") };
  }
  return { mode: "grid", items: list.filter((project) => project.kind === activeFilter) };
}

function renderCatalog() {
  const view = viewProjects();
  if (view.mode === "split") {
    const parts = [];
    if (!view.current.length && !view.earlier.length) parts.push(emptyState());
    if (view.current.length) parts.push(cardGrid(view.current));
    if (view.earlier.length) parts.push(sectionLabel("Earlier"), rowList(view.earlier));
    catalog.replaceChildren(...parts);
    return;
  }
  if (!view.items.length) {
    catalog.replaceChildren(emptyState());
    return;
  }
  catalog.replaceChildren(view.mode === "rows" ? rowList(view.items) : cardGrid(view.items));
}

function renderDetail(project) {
  const wrap = el("div", { class: "detail-inner" }, [
    el("a", { class: "back", href: "#home" }, "All work")
  ]);
  if (!project) {
    wrap.append(
      el("h2", {}, "No project matches this link."),
      el("p", {}, "It may have been removed from data/site.json.")
    );
    return wrap;
  }
  if (project.image) wrap.append(el("img", { class: "detail-image", src: project.image, alt: "" }));
  const kicker = el("p", { class: "kicker" }, [stamp(project.status)]);
  if (project.year) kicker.append(el("span", { class: "year" }, project.year));
  wrap.append(kicker, el("h2", {}, project.title));
  const paragraphs = project.detail.length ? project.detail : project.summary ? [project.summary] : [];
  if (paragraphs.length) {
    wrap.append(el("div", { class: "prose" }, paragraphs.map((paragraph) => el("p", {}, paragraph))));
  }
  const tags = tagList(project.tags);
  if (tags) wrap.append(tags);
  if (project.links.length) {
    wrap.append(el("div", { class: "detail-links" }, project.links.map((link) => (
      el("a", { href: link.href, ...externalAttrs(link.href) }, link.label)
    ))));
  }
  return wrap;
}

function showList() {
  intro.hidden = false;
  work.hidden = false;
  detail.hidden = true;
  detail.replaceChildren();
  renderCatalog();
  document.title = profile.name || "Portfolio";
}

function showDetail(slug) {
  const project = projects.find((item) => item.slug === slug);
  intro.hidden = true;
  work.hidden = true;
  detail.hidden = false;
  detail.replaceChildren(renderDetail(project));
  document.title = project ? `${project.title} · ${profile.name}` : (profile.name || "Portfolio");
  const heading = detail.querySelector("h2");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus();
  }
}

function route() {
  const slug = decodeURIComponent(location.hash.replace(/^#/, ""));
  window.scrollTo(0, 0);
  if (!slug || slug === "home") showList();
  else showDetail(slug);
}

function setJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: profile.summary,
    url: `${location.origin}${location.pathname}`,
    sameAs: (profile.links || []).map((link) => link.href).filter((href) => /^https?:\/\//.test(href))
  };
  if (profile.org) data.worksFor = { "@type": "Organization", name: profile.org };
  if (profile.place) data.homeLocation = { "@type": "Place", name: profile.place };
  let script = document.getElementById("jsonld");
  if (!script) {
    script = document.createElement("script");
    script.id = "jsonld";
    script.type = "application/ld+json";
    document.head.append(script);
  }
  script.textContent = JSON.stringify(data);
}

function renderShell() {
  document.querySelector(".masthead").replaceChildren(...renderMasthead());
  intro = renderIntro();
  work = renderWork();
  detail = el("article", { class: "detail", hidden: true });
  document.querySelector("#content").replaceChildren(intro, work, detail);
  document.querySelector("footer").replaceChildren(renderFooter());
  const description = document.querySelector('meta[name="description"]');
  if (description && profile.summary) description.setAttribute("content", profile.summary);
  const og = document.querySelector('meta[property="og:description"]');
  if (og && profile.summary) og.setAttribute("content", profile.summary);
  if (profile.name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", profile.name);
  }
  setJsonLd();
}

async function init() {
  const main = document.querySelector("#content");
  try {
    const response = await fetch("data/site.json");
    if (!response.ok) throw new Error(`status ${response.status}`);
    profile = await response.json();
  } catch (error) {
    main.replaceChildren(el("p", { class: "error" }, "Could not load data/site.json."));
    return;
  }
  projects = (profile.projects || []).map(normalize).filter(Boolean);
  renderShell();
  route();
  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && location.hash && location.hash !== "#home") location.hash = "home";
  });
}

init();
