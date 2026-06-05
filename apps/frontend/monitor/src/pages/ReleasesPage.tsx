import { useEffect, useState } from 'react';
import type { ProjectResponse, ReleaseCompareResponse, ReleaseResponse } from '@sentry-guardian/types';
import { Button, Card, Input } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function ReleasesPage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState('');
  const [releases, setReleases] = useState<ReleaseResponse[]>([]);
  const [compare, setCompare] = useState<ReleaseCompareResponse | null>(null);
  const [version, setVersion] = useState('');
  const [uploadReleaseId, setUploadReleaseId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
    });
  }, [api]);

  useEffect(() => {
    if (!projectId) return;
    void api.listReleases(projectId).then(setReleases);
    void api.releaseCompare(projectId).then(setCompare);
  }, [api, projectId]);

  async function createRelease(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !version) return;
    const rel = await api.createRelease(projectId, { version });
    setVersion('');
    setUploadReleaseId(rel.id);
    void api.listReleases(projectId).then(setReleases);
  }

  async function uploadMap(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !uploadReleaseId || !file) return;
    await api.uploadSourceMap(projectId, uploadReleaseId, file);
    setFile(null);
    void api.listReleases(projectId).then(setReleases);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Releases & Source Maps</h1>
      <label className="mb-4 block text-sm text-zinc-400">
        项目
        <select
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <Card>
        <h2 className="mb-3 font-medium">创建 Release</h2>
        <form className="flex gap-2" onSubmit={(e) => void createRelease(e)}>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
          <Button type="submit">创建</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">上传 Source Map</h2>
        <form className="space-y-2" onSubmit={(e) => void uploadMap(e)}>
          <select
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            value={uploadReleaseId}
            onChange={(e) => setUploadReleaseId(e.target.value)}
          >
            <option value="">选择 Release</option>
            {releases.map((r) => (
              <option key={r.id} value={r.id}>
                {r.version}
              </option>
            ))}
          </select>
          <input type="file" accept=".map" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button type="submit" disabled={!file || !uploadReleaseId}>
            上传
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Release 列表</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2">版本</th>
              <th className="pb-2">Artifacts</th>
              <th className="pb-2">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <tr key={r.id} className="border-t border-zinc-800">
                <td className="py-2">{r.version}</td>
                <td className="py-2">{r.artifact_count}</td>
                <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {compare && (
        <Card>
          <h2 className="mb-3 font-medium">版本对比</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2">Release</th>
                <th className="pb-2">Events</th>
                <th className="pb-2">Issues</th>
                <th className="pb-2">24h 新 Issue</th>
              </tr>
            </thead>
            <tbody>
              {compare.items.map((row) => (
                <tr
                  key={row.version}
                  className={`border-t border-zinc-800 ${row.new_issues_24h > 5 ? 'bg-red-950/30' : ''}`}
                >
                  <td className="py-2">{row.version}</td>
                  <td className="py-2">{row.event_count}</td>
                  <td className="py-2">{row.issue_count}</td>
                  <td className="py-2">{row.new_issues_24h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
