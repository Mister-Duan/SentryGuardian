import { useEffect, useState } from 'react';
import type { ProjectResponse, ReleaseCompareResponse, ReleaseResponse } from '@sentry-guardian/types';
import { Button, Card, FilterBar, FilterField, Input, Select, Table, TableHead, TableRow } from '../components/ui.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
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

  usePageHeader({ title: '版本', description: '版本管理与源码映射' });

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
    <div className="space-y-3">
      <FilterBar>
        <FilterField label="项目" className="max-w-[200px]">
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold">创建版本</h2>
          <form className="flex gap-2" onSubmit={(e) => void createRelease(e)}>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
            <Button type="submit" variant="primary" size="sm">
              创建
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">上传源码映射</h2>
          <form className="space-y-2" onSubmit={(e) => void uploadMap(e)}>
            <Select value={uploadReleaseId} onChange={(e) => setUploadReleaseId(e.target.value)}>
              <option value="">选择版本</option>
              {releases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.version}
                </option>
              ))}
            </Select>
            <input
              type="file"
              accept=".map"
              className="block w-full text-xs text-[var(--sg-text-muted)]"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button type="submit" variant="primary" size="sm" disabled={!file || !uploadReleaseId}>
              上传
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">版本列表</h2>
        <Table>
          <TableHead>
            <tr>
              <th className="pb-2 pr-3">版本</th>
              <th className="pb-2 pr-3 w-20">映射</th>
              <th className="pb-2">创建</th>
            </tr>
          </TableHead>
          <tbody>
            {releases.map((r) => (
              <TableRow key={r.id}>
                <td className="py-1.5 pr-3 text-xs">{r.version}</td>
                <td className="py-1.5 pr-3 text-xs tabular-nums">{r.artifact_count}</td>
                <td className="py-1.5 text-xs text-[var(--sg-text-muted)]">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>

      {compare && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">版本对比</h2>
          <Table>
            <TableHead>
              <tr>
                <th className="pb-2 pr-3">版本</th>
                <th className="pb-2 pr-3 w-16">事件</th>
                <th className="pb-2 pr-3 w-16">问题</th>
                <th className="pb-2 w-20">24h 新增</th>
              </tr>
            </TableHead>
            <tbody>
              {compare.items.map((row) => (
                <TableRow
                  key={row.version}
                  className={row.new_issues_24h > 5 ? 'bg-red-50' : ''}
                >
                  <td className="py-1.5 pr-3 text-xs">{row.version}</td>
                  <td className="py-1.5 pr-3 text-xs tabular-nums">{row.event_count}</td>
                  <td className="py-1.5 pr-3 text-xs tabular-nums">{row.issue_count}</td>
                  <td className="py-1.5 text-xs tabular-nums">{row.new_issues_24h}</td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
