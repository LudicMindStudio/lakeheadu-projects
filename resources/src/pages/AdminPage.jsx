import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { AGE_GROUPS, COLLECTIONS, FORMATS, badgeFor, formatDate } from "../lib/entries.js";

const FORMAT_OPTIONS = [
  ...FORMATS.map((format) => ({ key: format.key, label: format.label })),
  { key: "app", label: "mHealth app" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// The entry's id, derived from its title: lowercase words joined by dashes.
function toId(title) {
  return String(title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/, "");
}

function blankEntry() {
  return {
    id: "",
    title: "",
    format: "library",
    collection: null,
    source: "",
    url: null,
    description: "",
    age_groups: [],
    tags: [],
    published_date: null,
    added_date: today(),
    banner: null,
    embeds: [],
  };
}

function EntryForm({ mode, initial, busy, error, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [tagsText, setTagsText] = useState(() => initial.tags.join(", "));
  const [manualId, setManualId] = useState(mode === "edit");
  const [pathOpen, setPathOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const set = (field, value) => setDraft((previous) => ({ ...previous, [field]: value }));

  const onTitleChange = (value) => {
    setDraft((previous) => ({
      ...previous,
      title: value,
      id: manualId ? previous.id : toId(value),
    }));
  };

  const onTagsChange = (text) => {
    setTagsText(text);
    set(
      "tags",
      text
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    );
  };

  const onBannerKind = (kind) => {
    if (kind === "none") set("banner", null);
    else if (kind === "image") set("banner", { kind: "image", src: "" });
    else set("banner", { kind: "video", src: "", poster: "" });
    setPathOpen(false);
    setUploadError("");
  };

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !draft.banner) return;
    setUploading(true);
    setUploadError("");
    try {
      const result = await api.upload(file);
      set("banner", { ...draft.banner, src: result.src });
    } catch (uploadFailure) {
      setUploadError(uploadFailure.message);
    } finally {
      setUploading(false);
    }
  };

  const setEmbed = (index, patch) => {
    setDraft((previous) => ({
      ...previous,
      embeds: previous.embeds.map((media, at) => (at === index ? { ...media, ...patch } : media)),
    }));
  };

  const addEmbed = () => set("embeds", [...draft.embeds, { kind: "video", url: "", title: "" }]);

  const removeEmbed = (index) =>
    set(
      "embeds",
      draft.embeds.filter((_, at) => at !== index),
    );

  const bannerKind = draft.banner?.kind ?? "none";

  const submit = (event) => {
    event.preventDefault();
    const banner = draft.banner
      ? {
          kind: draft.banner.kind,
          src: draft.banner.src.trim(),
          poster: draft.banner.kind === "video" ? (draft.banner.poster ?? "").trim() : undefined,
          alt: draft.banner.alt ?? "",
        }
      : null;
    const embeds = draft.embeds
      .map((media) => ({ kind: media.kind, url: media.url.trim(), title: media.title.trim() }))
      .filter((media) => media.url !== "" || media.title !== "");
    const payload = {
      ...draft,
      id: draft.id.trim(),
      title: draft.title.trim(),
      source: draft.source.trim(),
      url: draft.url?.trim() ? draft.url.trim() : null,
      description: draft.description.trim(),
      published_date: draft.published_date || null,
      added_date: draft.added_date || today(),
      banner,
      embeds,
    };
    onSave(payload);
  };

  return (
    <form className="admin" onSubmit={submit}>
      <div className="admin-head">
        <h1>{mode === "create" ? "Add entry" : "Edit entry"}</h1>
        <div className="admin-actions">
          <button type="submit" className="button" disabled={busy}>
            Save entry
          </button>
          <button type="button" className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-fields">
        <label className="admin-field">
          <span className="admin-label">Title</span>
          <input
            className="admin-input"
            value={draft.title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </label>
        <div className="admin-field">
          <span className="admin-label">Id</span>
          {mode === "edit" ? (
            <input className="admin-input" value={draft.id} readOnly aria-label="Id" />
          ) : (
            <div className="admin-id-row">
              <input
                className="admin-input"
                value={draft.id}
                readOnly={!manualId}
                placeholder="Generated from the title"
                aria-label="Id"
                onChange={(event) => set("id", event.target.value)}
              />
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  if (manualId) {
                    setManualId(false);
                    set("id", toId(draft.title));
                  } else {
                    setManualId(true);
                  }
                }}
              >
                {manualId ? "Generate from title" : "Set manually"}
              </button>
            </div>
          )}
        </div>
        <label className="admin-field">
          <span className="admin-label">Format</span>
          <select
            className="admin-input"
            value={draft.format}
            onChange={(event) => {
              const format = event.target.value;
              set("format", format);
              if (format !== "app") set("collection", null);
            }}
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {draft.format === "app" && (
          <label className="admin-field">
            <span className="admin-label">Collection</span>
            <select
              className="admin-input"
              value={draft.collection ?? ""}
              onChange={(event) => set("collection", event.target.value || null)}
            >
              <option value="">Choose a collection…</option>
              {COLLECTIONS.map((collection) => (
                <option key={collection.key} value={collection.key}>
                  {collection.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="admin-field">
          <span className="admin-label">Source</span>
          <input
            className="admin-input"
            value={draft.source}
            onChange={(event) => set("source", event.target.value)}
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Url</span>
          <input
            className="admin-input"
            value={draft.url ?? ""}
            placeholder="https://…"
            onChange={(event) => set("url", event.target.value)}
          />
        </label>
        <label className="admin-field admin-field-wide">
          <span className="admin-label">Description</span>
          <textarea
            className="admin-input admin-textarea"
            rows={3}
            value={draft.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </label>
        <div className="admin-field admin-field-wide" role="group" aria-label="Age groups">
          <span className="admin-label">Age groups</span>
          <div className="admin-checks">
            {AGE_GROUPS.map((group) => (
              <label key={group.key} className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.age_groups.includes(group.key)}
                  onChange={() =>
                    set(
                      "age_groups",
                      draft.age_groups.includes(group.key)
                        ? draft.age_groups.filter((key) => key !== group.key)
                        : [...draft.age_groups, group.key],
                    )
                  }
                />
                <span>{group.label}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="admin-field">
          <span className="admin-label">Topics</span>
          <input
            className="admin-input"
            value={tagsText}
            placeholder="sleep, privacy, apps"
            onChange={(event) => onTagsChange(event.target.value)}
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Published</span>
          <input
            className="admin-input"
            type="date"
            value={draft.published_date ?? ""}
            onChange={(event) => set("published_date", event.target.value || null)}
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Added</span>
          <input
            className="admin-input"
            type="date"
            value={draft.added_date ?? ""}
            onChange={(event) => set("added_date", event.target.value)}
          />
        </label>
      </div>

      <fieldset className="admin-group">
        <legend>Banner media</legend>
        <div className="admin-fields">
          <label className="admin-field">
            <span className="admin-label">Kind</span>
            <select
              className="admin-input"
              value={bannerKind}
              onChange={(event) => onBannerKind(event.target.value)}
            >
              <option value="none">None</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          {draft.banner && (
            <>
              <div className="admin-field">
                <span className="admin-label">
                  {draft.banner.kind === "video" ? "Video file" : "Image file"}
                </span>
                <div className="admin-upload">
                  <label className="button-secondary admin-upload-button">
                    {uploading ? "Uploading…" : draft.banner.src ? "Replace file" : "Upload file"}
                    <input
                      type="file"
                      className="visually-hidden"
                      accept={
                        draft.banner.kind === "video"
                          ? "video/mp4,video/webm"
                          : "image/jpeg,image/png,image/webp,image/gif"
                      }
                      onChange={onUpload}
                      disabled={uploading}
                    />
                  </label>
                  {draft.banner.src && (
                    <span className="admin-upload-name" title={draft.banner.src}>
                      {draft.banner.src.split("/").pop()}
                    </span>
                  )}
                </div>
                {!pathOpen && (
                  <button type="button" className="link-button" onClick={() => setPathOpen(true)}>
                    Use a path instead
                  </button>
                )}
                {pathOpen && (
                  <input
                    className="admin-input"
                    aria-label="File path"
                    value={draft.banner.src}
                    placeholder="/media/banners/… or /uploads/…"
                    onChange={(event) =>
                      set("banner", { ...draft.banner, src: event.target.value })
                    }
                  />
                )}
                {uploadError && (
                  <p className="admin-error" role="alert">
                    {uploadError}
                  </p>
                )}
              </div>
              {draft.banner.kind === "video" && (
                <label className="admin-field">
                  <span className="admin-label">Poster path</span>
                  <input
                    className="admin-input"
                    value={draft.banner.poster ?? ""}
                    placeholder="/media/video/…-poster.jpg"
                    onChange={(event) =>
                      set("banner", { ...draft.banner, poster: event.target.value })
                    }
                  />
                </label>
              )}
              {draft.banner.kind === "image" && draft.banner.src && (
                <div className="admin-field admin-upload-preview">
                  <span className="admin-label">Preview</span>
                  <img src={draft.banner.src} alt="" />
                </div>
              )}
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="admin-group">
        <legend>Embedded media</legend>
        {draft.embeds.length === 0 && (
          <p className="admin-line">No embedded media yet. Add videos or documents below.</p>
        )}
        {draft.embeds.map((media, index) => (
          <div className="admin-media-row" key={index}>
            <label className="admin-field">
              <span className="admin-label">Kind</span>
              <select
                className="admin-input"
                value={media.kind}
                onChange={(event) => setEmbed(index, { kind: event.target.value })}
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="admin-field admin-media-link">
              <span className="admin-label">Link</span>
              <input
                className="admin-input"
                value={media.url}
                placeholder="/media/… or a video link"
                onChange={(event) => setEmbed(index, { url: event.target.value })}
              />
            </label>
            <label className="admin-field admin-media-title">
              <span className="admin-label">Caption</span>
              <input
                className="admin-input"
                value={media.title}
                onChange={(event) => setEmbed(index, { title: event.target.value })}
              />
            </label>
            <button
              type="button"
              className="link-button admin-media-remove"
              onClick={() => removeEmbed(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="button-secondary admin-add-media" onClick={addEmbed}>
          Add media
        </button>
      </fieldset>
    </form>
  );
}

// What the server says about this visitor, without touching component state.
async function fetchStatus() {
  const status = await api.status();
  if (status.configured === false) return { phase: "unconfigured" };
  if (status.authed) {
    const data = await api.entries();
    return { phase: "ready", entries: data.entries ?? [] };
  }
  return { phase: "login" };
}

// Managing entries: a sign-in, a table, and one form that covers every field.
// Works only while the bundled server is running, and says so plainly when not.
export default function AdminPage() {
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    document.title = "Manage entries · Resources & tools";
  }, []);

  const apply = useCallback((result) => {
    if (result.entries) setEntries(result.entries);
    setPhase(result.phase);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStatus()
      .then((result) => {
        if (!cancelled) apply(result);
      })
      .catch(() => {
        if (!cancelled) setPhase("offline");
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const onLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(password);
      setPassword("");
      apply(await fetchStatus());
    } catch (loginError) {
      setError(loginError.status === 401 ? "That password was not accepted." : loginError.message);
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    try {
      await api.logout();
    } catch {
      // The session may already be gone, so fall through to a fresh check.
    }
    setEntries([]);
    setForm(null);
    try {
      apply(await fetchStatus());
    } catch {
      setPhase("offline");
    }
  };

  const onSave = async (payload) => {
    setBusy(true);
    setError("");
    try {
      if (form.mode === "create") {
        const result = await api.create(payload);
        const saved = result.entry ?? payload;
        setEntries((list) => [saved, ...list.filter((entry) => entry.id !== saved.id)]);
      } else {
        const result = await api.update(payload.id, payload);
        const saved = result.entry ?? payload;
        setEntries((list) => list.map((entry) => (entry.id === saved.id ? saved : entry)));
      }
      setForm(null);
    } catch (saveError) {
      setError(
        saveError.status === 409 ? "An entry with that id already exists." : saveError.message,
      );
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (id) => {
    setBusy(true);
    setError("");
    try {
      await api.remove(id);
      setEntries((list) => list.filter((entry) => entry.id !== id));
      setConfirmId(null);
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="admin">
        <h1>Manage entries</h1>
        <p className="admin-line">Checking the management server…</p>
      </div>
    );
  }

  if (phase === "offline") {
    return (
      <div className="admin">
        <h1>Manage entries</h1>
        <p className="admin-line">
          The management server is not running, so entries cannot be edited right now. Start it with{" "}
          <code>npm run server</code> and reload.
        </p>
      </div>
    );
  }

  if (phase === "unconfigured") {
    return (
      <div className="admin">
        <h1>Manage entries</h1>
        <p className="admin-line">
          The management server is running without an admin password. Set{" "}
          <code>ADMIN_PASSWORD</code> and restart it to enable editing.
        </p>
      </div>
    );
  }

  if (phase === "login") {
    return (
      <div className="admin admin-narrow">
        <h1>Manage entries</h1>
        <p className="admin-line">Sign in to add, edit, and remove entries.</p>
        <form className="admin-login" onSubmit={onLogin}>
          <label className="admin-field">
            <span className="admin-label">Password</span>
            <input
              className="admin-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" className="button" disabled={busy || password === ""}>
            Sign in
          </button>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    );
  }

  if (form) {
    return (
      <EntryForm
        mode={form.mode}
        initial={form.draft}
        busy={busy}
        error={error}
        onCancel={() => {
          setForm(null);
          setError("");
        }}
        onSave={onSave}
      />
    );
  }

  return (
    <div className="admin">
      <div className="admin-head">
        <h1>Manage entries</h1>
        <div className="admin-actions">
          <button
            type="button"
            className="button"
            onClick={() => {
              setError("");
              setForm({ mode: "create", draft: blankEntry() });
            }}
          >
            Add entry
          </button>
          <button type="button" className="button-secondary" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Format</th>
            <th>Source</th>
            <th>Updated</th>
            <th>
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.title}</td>
              <td>{badgeFor(entry.format)}</td>
              <td>{entry.source}</td>
              <td>{formatDate(entry.updated_date || entry.added_date)}</td>
              <td className="admin-row-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setError("");
                    setForm({ mode: "edit", draft: { ...entry } });
                  }}
                >
                  Edit
                </button>
                {confirmId === entry.id ? (
                  <>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onRemove(entry.id)}
                      disabled={busy}
                    >
                      Confirm remove
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setConfirmId(null)}
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setConfirmId(entry.id)}
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
