/**
 * The control panel's plumbing. The site is static files on GitHub Pages: there is no
 * server to log in to. What CAN change the site is a commit to its repository, and only
 * someone holding a GitHub token for that repository can make one.
 *
 * So: the owner's token is kept IN the repository, encrypted with her password
 * (`content/admin.json`). Typing the password in the panel decrypts the token in the
 * browser; the panel then saves her edits as commits through GitHub's API. Without the
 * password the file is noise; the token never leaves the browser except to api.github.com.
 */

export interface Lock {
  /** PBKDF2 rounds used to turn the password into the key. */
  iterations: number;
  salt: string;
  iv: string;
  /** The token, AES-GCM encrypted. */
  data: string;
}

const ITERATIONS = 310_000;

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const fromBase64 = (text: string): Uint8Array => Uint8Array.from(atob(text.replace(/\s/g, '')), (char) => char.charCodeAt(0));

async function keyFrom(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, material, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function lockToken(token: string, password: string): Promise<Lock> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(password, salt, ITERATIONS);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(token));
  return { iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}

/** The token, or `null` when the password is wrong. */
export async function unlockToken(lock: Lock, password: string): Promise<string | null> {
  try {
    const key = await keyFrom(password, fromBase64(lock.salt), lock.iterations);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(lock.iv) as BufferSource }, key, fromBase64(lock.data) as BufferSource);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/* --- GitHub: reading and committing the content files --- */

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function github(repo: string, branch: string) {
  const call = async (path: string, token?: string, init?: RequestInit) => {
    const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new GitHubError(response.status, (detail as { message?: string }).message || response.statusText);
    }
    return response.json();
  };

  return {
    /** Whether this token may write to the repository. */
    async canWrite(token: string): Promise<boolean> {
      const info = (await call('', token)) as { permissions?: { push?: boolean } };
      return Boolean(info.permissions?.push);
    },

    /** A JSON file of the repository as it is now, with the id needed to replace it. */
    async read<T>(file: string, token?: string): Promise<{ value: T; sha: string }> {
      const entry = (await call(`/contents/${file}?ref=${encodeURIComponent(branch)}`, token)) as { content: string; sha: string };
      return { value: JSON.parse(new TextDecoder().decode(fromBase64(entry.content))) as T, sha: entry.sha };
    },

    /**
     * A JSON file as anyone may read it, without a token. It comes from GitHub's file server,
     * not from its API: the API answers a visitor it does not know only 60 times an hour for
     * a whole network, and the panel must open every time. A copy read this way can be a few
     * minutes behind the repository.
     */
    async peek<T>(file: string): Promise<T> {
      const response = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}?at=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new GitHubError(response.status, response.statusText);
      return (await response.json()) as T;
    },

    /** The names of the files in a folder of the repository. */
    async list(folder: string, token?: string): Promise<string[]> {
      const entries = (await call(`/contents/${folder}?ref=${encodeURIComponent(branch)}`, token)) as { name: string; type: string }[];
      return entries.filter((entry) => entry.type === 'file').map((entry) => entry.name);
    },

    /** Commits a picture (or any binary file) under a NEW name. */
    async upload(file: string, bytes: Uint8Array, message: string, token: string): Promise<void> {
      await call(`/contents/${file}`, token, { method: 'PUT', body: JSON.stringify({ message, content: toBase64(bytes), branch }) });
    },

    /** Deletes a file of the repository. */
    async remove(file: string, sha: string, message: string, token: string): Promise<void> {
      await call(`/contents/${file}`, token, { method: 'DELETE', body: JSON.stringify({ message, sha, branch }) });
    },

    /** Where a committed file can be seen at once, before the site is rebuilt. */
    raw: (file: string): string => `https://raw.githubusercontent.com/${repo}/${branch}/${file}`,

    /** Commits a new version of a JSON file; returns its new id. */
    async write(file: string, value: unknown, sha: string | undefined, message: string, token: string): Promise<string> {
      const content = toBase64(new TextEncoder().encode(JSON.stringify(value, null, 2) + '\n'));
      const result = (await call(`/contents/${file}`, token, {
        method: 'PUT',
        body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
      })) as { content: { sha: string } };
      return result.content.sha;
    },
  };
}
