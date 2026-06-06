import { useEffect, useMemo, useState } from 'react';
import type {
  ProjectResponse,
  ReleaseCompareResponse,
  ReleaseResponse,
  ReleaseStats,
} from '@sentry-guardian/types';
import { ReorderableTable, type TableColumnDef } from '../components/ReorderableTable.js';
import { Button, Card, FilterBar, FilterField, Input, Select } from '../components/ui.js';
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

  const releaseColumns = useMemo<TableColumnDef<ReleaseResponse>[]>(
    () => [
      {
        id: 'version',
        header: '版本',
        cellClassName: 'text-xs',
        render: (r) => r.version,
      },
      {
        id: 'artifacts',
        header: '映射',
        cellClassName: 'text-xs tabular-nums',
        render: (r) => r.artifact_count,
      },
      {
        id: 'created_at',
        header: '创建',
        cellClassName: 'text-xs text-[var(--sg-text-muted)]',
        render: (r) => new Date(r.created_at).toLocaleString(),
      },
    ],
    [],
  );

  const compareColumns = useMemo<TableColumnDef<ReleaseStats>[]>(
    () => [
      {
        id: 'version',
        header: '版本',
        cellClassName: 'text-xs',
        render: (row) => row.version,
      },
      {
        id: 'events',
        header: '事件',
        cellClassName: 'text-xs tabular-nums',
        render: (row) => row.event_count,
      },
      {
        id: 'issues',
        header: '问题',
        cellClassName: 'text-xs tabular-nums',
        render: (row) => row.issue_count,
      },
      {
        id: 'new_issues',
        header: '24h 新增',
        cellClassName: 'text-xs tabular-nums',
        render: (row) => row.new_issues_24h,
      },
    ],
    [],
  );

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
        <ReorderableTable
          tableId="releases-list"
          columns={releaseColumns}
          rows={releases}
          getRowKey={(r) => r.id}
        />
      </Card>

      {compare && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold">版本对比</h2>
          <ReorderableTable
            tableId="releases-compare"
            columns={compareColumns}
            rows={compare.items}
            getRowKey={(row) => row.version}
            getRowClassName={(row) => (row.new_issues_24h > 5 ? 'bg-red-50' : '')}
          />
        </Card>
      )}
    </div>
  );
}
