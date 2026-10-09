// The entry manager, behind the login. One password, one editor: create,
// edit, and delete entries. Changes publish to the store the public site
// reads. Present when the app runs with its server.

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EntryForm from "../components/admin/EntryForm.jsx";
import { STATUS_LABELS } from "../data/filters.js";
import {
  createEntry,
  deleteEntry,
  fetchServerEntries,
  fetchSession,
  logIn,
  logOut,
  updateEntry,
} from "../lib/api.js";

export default function AdminPage() {
  const [status, setStatus] = useState("loading");
  const [entries, setEntries] = useState([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [formErrors, setFormErrors] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const result = await fetchServerEntries();
    if (result.ok && Array.isArray(result.data?.entries)) {
      setEntries(result.data.entries);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      let session = null;
      try {
        session = await fetchSession();
      } catch {
        session = null;
      }
      if (!active) {
        return;
      }
      const data = session?.data;
      if (!session?.ok || !data || typeof data.enabled !== "boolean") {
        setStatus("offline");
      } else if (!data.enabled) {
        setStatus("disabled");
      } else if (data.admin) {
        setStatus("ready");
        refresh();
      } else {
        setStatus("login");
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await logIn(password);
      if (result.ok) {
        setPassword("");
        setStatus("ready");
        await refresh();
      } else if (result.status === 401) {
        setError("That password didn't work.");
      } else if (result.status === 403) {
        setError("The editor is not enabled on this server.");
      } else {
        setError("Sign-in didn't go through. Try again.");
      }
    } catch {
      setError("Can't reach the server right now.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch {
      // signing out locally is enough
    }
    setStatus("login");
    setMode("list");
    setEditing(null);
  };

  const handleSave = async (draft) => {
    setBusy(true);
    setFormErrors(null);
    try {
      const isNew = !editing;
      const result = isNew ? await createEntry(draft) : await updateEntry(editing.slug, draft);
      if (result.ok) {
        setFlash(isNew ? "Entry created." : "Entry saved.");
        setMode("list");
        setEditing(null);
        await refresh();
        return;
      }
      if (result.status === 401) {
        setStatus("login");
        return;
      }
      if (result.status === 409) {
        setFormErrors({ form: "An entry with that address already exists." });
        return;
      }
      setFormErrors(
        result.data?.errors ?? { form: "That didn't save. Check the fields and try again." },
      );
    } catch {
      setFormErrors({ form: "Can't reach the server right now." });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (slug) => {
    setConfirming(null);
    try {
      const result = await deleteEntry(slug);
      if (result.ok) {
        setFlash("Entry deleted.");
        await refresh();
      } else if (result.status === 401) {
        setStatus("login");
      }
    } catch {
      setFlash("Can't reach the server right now.");
    }
  };

  return (
    <div className="page">
      <div className="page-inner">
        <p className="admin-back">
          <Link to="/">Back to the map</Link>
        </p>
        <div className="admin-head">
          <h1>Entry manager</h1>
          {status === "ready" && (
            <div className="admin-head-actions">
              {mode === "list" && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setEditing(null);
                    setFormErrors(null);
                    setFlash("");
                    setMode("create");
                  }}
                >
                  New entry
                </button>
              )}
              <button type="button" className="btn-quiet" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>

        {flash && (
          <p className="admin-flash" role="status">
            {flash}
          </p>
        )}

        {status === "loading" && <p className="muted">Checking the editor…</p>}

        {status === "offline" && (
          <div className="admin-note">
            <p>The editor is available when the app runs with its server.</p>
            <p className="muted">Started statically, the site serves its bundled listings.</p>
          </div>
        )}

        {status === "disabled" && (
          <div className="admin-note">
            <p>The editor is not enabled on this server.</p>
            <p className="muted">Set the admin password on the server to turn it on.</p>
          </div>
        )}

        {status === "login" && (
          <form className="login-form" onSubmit={handleLogin}>
            <label className="form-field" htmlFor="admin-password">
              <span>Admin password</span>
              <input
                id="admin-password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn" disabled={busy || password === ""}>
              Sign in
            </button>
          </form>
        )}

        {status === "ready" && mode === "list" && (
          <>
            <p className="muted admin-count">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
            {entries.length === 0 ? (
              <p className="muted">No entries yet. Create the first one.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Program</th>
                    <th scope="col">Organization</th>
                    <th scope="col">Town</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last verified</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.slug}>
                      <td>{entry.program}</td>
                      <td>{entry.org}</td>
                      <td>{entry.region}</td>
                      <td>{STATUS_LABELS[entry.status] ?? "—"}</td>
                      <td>{entry.lastVerified}</td>
                      <td className="admin-actions">
                        <button
                          type="button"
                          className="admin-link"
                          onClick={() => {
                            setEditing(entry);
                            setFormErrors(null);
                            setFlash("");
                            setMode("edit");
                          }}
                        >
                          Edit
                        </button>
                        {confirming === entry.slug ? (
                          <>
                            <button
                              type="button"
                              className="admin-link admin-link-danger"
                              onClick={() => handleDelete(entry.slug)}
                            >
                              Confirm delete
                            </button>
                            <button
                              type="button"
                              className="admin-link"
                              onClick={() => setConfirming(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-link"
                            onClick={() => setConfirming(entry.slug)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {status === "ready" && mode !== "list" && (
          <EntryForm
            initial={mode === "edit" ? editing : null}
            errors={formErrors}
            busy={busy}
            onSubmit={handleSave}
            onCancel={() => {
              setMode("list");
              setEditing(null);
              setFormErrors(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
