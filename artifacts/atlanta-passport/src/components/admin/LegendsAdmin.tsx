import { useEffect, useMemo, useState } from "react";
import { BookOpen, Eye, Loader2, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type LegendRecord = {
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[] | null;
  authorName: string | null;
  heroImage: string | null;
  status: string;
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  adminNotes: string | null;
  updatedAt: string;
};

type EditorState = {
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  authorName: string;
  heroImage: string;
  status: string;
  scheduledPublishAt: string;
  isFeatured: boolean;
  readingTimeMinutes: string;
  seoTitle: string;
  seoDescription: string;
  adminNotes: string;
};

const EMPTY_EDITOR: EditorState = {
  title: "",
  slug: "",
  subtitle: "",
  excerpt: "",
  body: "",
  category: "guide",
  tags: "",
  authorName: "",
  heroImage: "",
  status: "draft",
  scheduledPublishAt: "",
  isFeatured: false,
  readingTimeMinutes: "",
  seoTitle: "",
  seoDescription: "",
  adminNotes: "",
};

const STATUSES = [
  ["draft", "Draft"],
  ["in_review", "In review"],
  ["approved", "Approved"],
  ["scheduled", "Scheduled"],
  ["published", "Published"],
  ["archived", "Archived"],
] as const;

function toEditor(post: LegendRecord): EditorState {
  return {
    title: post.title,
    slug: post.slug ?? "",
    subtitle: post.subtitle ?? "",
    excerpt: post.excerpt ?? "",
    body: post.body ?? "",
    category: post.category,
    tags: (post.tags ?? []).join(", "),
    authorName: post.authorName ?? "",
    heroImage: post.heroImage ?? "",
    status: post.status,
    scheduledPublishAt: post.scheduledPublishAt
      ? new Date(post.scheduledPublishAt).toISOString().slice(0, 16)
      : "",
    isFeatured: post.isFeatured,
    readingTimeMinutes: post.readingTimeMinutes?.toString() ?? "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    adminNotes: post.adminNotes ?? "",
  };
}

export function LegendsAdmin({ adminKey }: { adminKey: string }) {
  const [posts, setPosts] = useState<LegendRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId],
  );

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/legends", {
        headers: { "x-admin-key": adminKey },
      });
      if (!response.ok) throw new Error("Could not load ATL Legends");
      setPosts((await response.json()) as LegendRecord[]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load ATL Legends",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, [adminKey]);

  function selectPost(post: LegendRecord) {
    setSelectedId(post.id);
    setEditor(toEditor(post));
    setError("");
    setNotice("");
  }

  function createNew() {
    setSelectedId(null);
    setEditor(EMPTY_EDITOR);
    setError("");
    setNotice("");
  }

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setEditor((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...editor,
        tags: editor.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        readingTimeMinutes: editor.readingTimeMinutes
          ? Number(editor.readingTimeMinutes)
          : null,
        scheduledPublishAt: editor.scheduledPublishAt
          ? new Date(editor.scheduledPublishAt).toISOString()
          : null,
      };
      const response = await fetch(
        selectedId ? `/api/admin/legends/${selectedId}` : "/api/admin/legends",
        {
          method: selectedId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as
        | LegendRecord
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in result && result.error ? result.error : "Save failed",
        );
      }
      const saved = result as LegendRecord;
      setSelectedId(saved.id);
      setEditor(toEditor(saved));
      setNotice(selectedId ? "Legend updated." : "Draft created.");
      await loadPosts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading ATL Legends…
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="space-y-3">
        <button
          type="button"
          onClick={createNew}
          className="button-pop flex w-full items-center justify-center gap-2 bg-brand-yellow px-4 py-2.5 font-display text-xs uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          New Legend
        </button>
        <div className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
          {posts.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-foreground/25 p-5 text-center text-sm text-foreground/60">
              No stories yet. Create the first draft.
            </div>
          )}
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => selectPost(post)}
              className={cn(
                "w-full rounded-xl border-2 p-3 text-left transition-colors",
                selectedId === post.id
                  ? "border-foreground bg-brand-yellow"
                  : "border-foreground/20 bg-white hover:border-foreground/50",
              )}
            >
              <span className="block font-display text-xs uppercase leading-snug">
                {post.title}
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-foreground/60">
                <span>{post.status.replace("_", " ")}</span>
                <span>{post.category}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0 space-y-5 rounded-2xl border-2 border-foreground bg-white p-4 shadow-pop sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.16em] text-brand-red">
              {selected ? "Edit story" : "New draft"}
            </p>
            <h2 className="mt-1 font-display text-xl uppercase">
              {editor.title || "Untitled Legend"}
            </h2>
          </div>
          <div className="flex gap-2">
            {selected?.status === "published" && selected.slug && (
              <a
                href={`/passport/legends/${selected.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-foreground px-3 font-display text-[10px] uppercase"
              >
                <Eye className="h-4 w-4" />
                View
              </a>
            )}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="button-pop inline-flex min-h-10 items-center gap-2 bg-brand-navy px-4 font-display text-[10px] uppercase text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg bg-green-100 p-3 text-sm text-green-800">
            {notice}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            required
            value={editor.title}
            onChange={(value) => update("title", value)}
          />
          <Field
            label="Slug"
            value={editor.slug}
            onChange={(value) => update("slug", value)}
            placeholder="Generated from title when blank"
          />
          <Field
            label="Subtitle"
            value={editor.subtitle}
            onChange={(value) => update("subtitle", value)}
          />
          <Field
            label="Author"
            value={editor.authorName}
            onChange={(value) => update("authorName", value)}
          />
          <Field
            label="Category"
            value={editor.category}
            onChange={(value) => update("category", value)}
          />
          <Field
            label="Tags"
            value={editor.tags}
            onChange={(value) => update("tags", value)}
            placeholder="food, west end, interview"
          />
          <Field
            label="Hero image URL"
            value={editor.heroImage}
            onChange={(value) => update("heroImage", value)}
          />
          <Field
            label="Reading time (minutes)"
            type="number"
            value={editor.readingTimeMinutes}
            onChange={(value) => update("readingTimeMinutes", value)}
          />
        </div>

        <TextField
          label="Excerpt"
          value={editor.excerpt}
          onChange={(value) => update("excerpt", value)}
          rows={3}
        />
        <TextField
          label="Article body"
          required
          value={editor.body}
          onChange={(value) => update("body", value)}
          rows={12}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide">
            Workflow status
            <select
              value={editor.status}
              onChange={(event) => update("status", event.target.value)}
              className="w-full rounded-lg border-2 border-foreground bg-white px-3 py-2 text-sm normal-case"
            >
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {editor.status === "scheduled" && (
            <Field
              label="Publish at"
              type="datetime-local"
              value={editor.scheduledPublishAt}
              onChange={(value) => update("scheduledPublishAt", value)}
              required
            />
          )}
        </div>

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={editor.isFeatured}
            onChange={(event) => update("isFeatured", event.target.checked)}
            className="h-5 w-5"
          />
          Feature this story in ATL Legends
        </label>

        <details className="rounded-xl border-2 border-foreground/20 p-4">
          <summary className="cursor-pointer font-display text-xs uppercase tracking-wide">
            SEO and staff notes
          </summary>
          <div className="mt-4 space-y-4">
            <Field
              label="SEO title"
              value={editor.seoTitle}
              onChange={(value) => update("seoTitle", value)}
            />
            <TextField
              label="SEO description"
              value={editor.seoDescription}
              onChange={(value) => update("seoDescription", value)}
              rows={3}
            />
            <TextField
              label="Internal notes"
              value={editor.adminNotes}
              onChange={(value) => update("adminNotes", value)}
              rows={3}
            />
          </div>
        </details>

        <div className="rounded-xl border-2 border-dashed border-foreground/25 bg-brand-cream p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <p className="font-display text-xs uppercase">Editor preview</p>
          </div>
          <h3 className="mt-4 font-display text-2xl uppercase leading-tight">
            {editor.title || "Untitled Legend"}
          </h3>
          {editor.subtitle && (
            <p className="mt-2 text-foreground/70">{editor.subtitle}</p>
          )}
          {editor.excerpt && (
            <p className="mt-4 text-sm leading-relaxed">{editor.excerpt}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide">
      {label}
      {required && <span className="text-brand-red"> *</span>}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border-2 border-foreground px-3 py-2 text-sm font-normal normal-case"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows: number;
}) {
  return (
    <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide">
      {label}
      {required && <span className="text-brand-red"> *</span>}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
        className="w-full resize-y rounded-lg border-2 border-foreground px-3 py-2 text-sm font-normal leading-relaxed normal-case"
      />
    </label>
  );
}
