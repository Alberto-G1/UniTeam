import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import { projectsAPI, projectFilesAPI, taskAPI } from '../../services/api';
import './ProjectFilesLibrary.css';

const tagOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'FINAL', label: 'Final' },
  { value: 'REFERENCE', label: 'Reference' },
  { value: 'ARCHIVE', label: 'Archive' },
];

const sortOptions = [
  { value: 'latest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'size', label: 'Largest first' },
];

const formatFileSize = (value = 0) => {
  if (!value) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const getUserName = (user) => {
  if (!user) return 'Unknown';
  return user.get_full_name ? user.get_full_name() : user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown';
};

export const ProjectFilesLibrary = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [trashEntries, setTrashEntries] = useState([]);
  const [versions, setVersions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingProjectData, setLoadingProjectData] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [uploadState, setUploadState] = useState({
    projectId: '',
    displayName: '',
    description: '',
    tag: 'DRAFT',
    folderId: '',
    linkedTaskId: '',
    versionNote: '',
    file: null,
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [versionUpload, setVersionUpload] = useState({ file: null, note: '', tag: 'DRAFT' });
  const [renameValue, setRenameValue] = useState('');
  const [moveFolderId, setMoveFolderId] = useState('');

  const selectedProjectId = searchParams.get('project') || '';
  const isLecturerRoute = location.pathname.startsWith('/lecturer/');

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const data = await projectsAPI.list();
        const list = Array.isArray(data) ? data : data?.results || [];
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('project', String(list[0].id));
          setSearchParams(nextParams, { replace: true });
        }
      } catch (error) {
        showToast('error', 'Projects unavailable', error.response?.data?.detail || 'Failed to load projects.');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [selectedProjectId, setSearchParams, showToast]);

  useEffect(() => {
    const loadTaskOptions = async () => {
      try {
        const projectId = selectedProjectId;
        if (!projectId) {
          setTaskOptions([]);
          return;
        }
        const data = await taskAPI.listTasks({ project: projectId });
        setTaskOptions(Array.isArray(data) ? data : data?.results || []);
      } catch (error) {
        setTaskOptions([]);
      }
    };

    loadTaskOptions();
  }, [selectedProjectId]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProjectId) {
        setFolders([]);
        setFiles([]);
        setTrashEntries([]);
        setSelectedFile(null);
        setVersions([]);
        setActivityLogs([]);
        return;
      }

      setLoadingProjectData(true);
      try {
        const [foldersData, filesData, trashData] = await Promise.all([
          projectFilesAPI.listFolders({ project: selectedProjectId }),
          projectFilesAPI.listFiles({ project: selectedProjectId, include_deleted: showTrash ? '1' : '0' }),
          projectFilesAPI.listTrash({ project: selectedProjectId }),
        ]);
        setFolders(Array.isArray(foldersData) ? foldersData : foldersData?.results || []);
        setFiles(Array.isArray(filesData) ? filesData : filesData?.results || []);
        setTrashEntries(Array.isArray(trashData) ? trashData : trashData?.results || []);
        setSelectedFolderId('all');
        setSelectedFile(null);
        setVersions([]);
        setActivityLogs([]);
      } catch (error) {
        showToast('error', 'File library unavailable', error.response?.data?.error || 'Unable to load project files.');
      } finally {
        setLoadingProjectData(false);
      }
    };

    loadProjectData();
  }, [selectedProjectId, showTrash, showToast]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedFile?.id) {
        setVersions([]);
        setActivityLogs([]);
        setRenameValue('');
        setMoveFolderId('');
        return;
      }

      setLoadingDetails(true);
      try {
        const [versionsData, activityData] = await Promise.all([
          projectFilesAPI.listVersions({ file: selectedFile.id }),
          projectFilesAPI.listActivity({ file: selectedFile.id }),
        ]);
        setVersions(Array.isArray(versionsData) ? versionsData : versionsData?.results || []);
        setActivityLogs(Array.isArray(activityData) ? activityData : activityData?.results || []);
        setRenameValue(selectedFile.display_name || '');
        setMoveFolderId(selectedFile.folder?.id ? String(selectedFile.folder.id) : '');
      } catch (error) {
        showToast('error', 'Unable to load file details', 'Please try again.');
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [selectedFile, showToast]);

  const currentProject = projects.find((item) => String(item.id) === selectedProjectId);
  const projectsListPath = isLecturerRoute ? '/lecturer/projects' : '/student/projects';
  const projectDashboardPath = currentProject
    ? (isLecturerRoute ? `/lecturer/projects/${currentProject.id}` : `/student/projects/${currentProject.id}`)
    : projectsListPath;
  const visibleFiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return files
      .filter((item) => (selectedFolderId === 'all' ? true : String(item.folder?.id || '') === String(selectedFolderId)))
      .filter((item) => {
        if (!query) return true;
        return [item.display_name, item.description, item.stored_file_name, item.folder?.name, item.uploaded_by?.username]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((left, right) => {
        if (sortBy === 'name') return (left.display_name || '').localeCompare(right.display_name || '');
        if (sortBy === 'size') return (right.file_size || 0) - (left.file_size || 0);
        const leftTime = new Date(left.upload_timestamp || 0).getTime();
        const rightTime = new Date(right.upload_timestamp || 0).getTime();
        return sortBy === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
      });
  }, [files, searchTerm, selectedFolderId, sortBy]);

  const selectedFolder = selectedFolderId === 'all'
    ? null
    : folders.find((folder) => String(folder.id) === String(selectedFolderId));

  const canManageFiles = currentProject && (user?.role === 'ADMIN' || user?.role === 'LECTURER' || currentProject.current_membership);
  const canManageFolders = user?.role === 'ADMIN' || user?.role === 'LECTURER' || currentProject?.current_membership?.role === 'LEADER' || currentProject?.current_membership?.role === 'CO_LEADER';

  const refreshProjectData = async () => {
    if (!selectedProjectId) return;
    const [foldersData, filesData, trashData] = await Promise.all([
      projectFilesAPI.listFolders({ project: selectedProjectId }),
      projectFilesAPI.listFiles({ project: selectedProjectId, include_deleted: showTrash ? '1' : '0' }),
      projectFilesAPI.listTrash({ project: selectedProjectId }),
    ]);
    setFolders(Array.isArray(foldersData) ? foldersData : foldersData?.results || []);
    setFiles(Array.isArray(filesData) ? filesData : filesData?.results || []);
    setTrashEntries(Array.isArray(trashData) ? trashData : trashData?.results || []);
  };

  const handleProjectChange = (event) => {
    const nextParams = new URLSearchParams(searchParams);
    if (event.target.value) {
      nextParams.set('project', event.target.value);
    } else {
      nextParams.delete('project');
    }
    setSearchParams(nextParams);
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!selectedProjectId || !newFolderName.trim()) return;
    try {
      await projectFilesAPI.createFolder({ project: selectedProjectId, name: newFolderName.trim() });
      setNewFolderName('');
      await refreshProjectData();
      showToast('success', 'Folder created', 'The new folder is ready to use.');
    } catch (error) {
      showToast('error', 'Folder not created', error.response?.data?.error || 'Please try again.');
    }
  };

  const handleUploadFile = async (event) => {
    event.preventDefault();
    if (!selectedProjectId || !uploadState.file) {
      showToast('error', 'File required', 'Choose a file before uploading.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('project', selectedProjectId);
      if (uploadState.folderId) {
        formData.append('folder_id', uploadState.folderId);
      }
      if (uploadState.displayName.trim()) {
        formData.append('display_name', uploadState.displayName.trim());
      }
      if (uploadState.description.trim()) {
        formData.append('description', uploadState.description.trim());
      }
      if (uploadState.tag) {
        formData.append('tag', uploadState.tag);
      }
      if (uploadState.linkedTaskId) {
        formData.append('linked_task_id', uploadState.linkedTaskId);
      }
      if (uploadState.versionNote.trim()) {
        formData.append('version_note', uploadState.versionNote.trim());
      }
      formData.append('file', uploadState.file);
      await projectFilesAPI.createFile(formData);
      setUploadState({
        projectId: selectedProjectId,
        displayName: '',
        description: '',
        tag: 'DRAFT',
        folderId: '',
        linkedTaskId: '',
        versionNote: '',
        file: null,
      });
      await refreshProjectData();
      showToast('success', 'File uploaded', 'The file has been added to the project library.');
    } catch (error) {
      showToast('error', 'Upload failed', error.response?.data?.error || 'Please check the file and try again.');
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  const handleLockAndPrepareVersion = async () => {
    if (!selectedFile) return;
    try {
      await projectFilesAPI.startVersionLock(selectedFile.id);
      showToast('info', 'Version locked', 'You have 10 minutes to upload the new version.');
      await refreshProjectData();
      const refreshed = await projectFilesAPI.getFile(selectedFile.id);
      setSelectedFile(refreshed);
    } catch (error) {
      showToast('error', 'Version lock unavailable', error.response?.data?.detail || error.response?.data?.error || 'Another member may already be editing this file.');
    }
  };

  const handleUploadVersion = async (event) => {
    event.preventDefault();
    if (!selectedFile || !versionUpload.file) {
      showToast('error', 'Version file required', 'Choose a file before uploading a new version.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', versionUpload.file);
      formData.append('version_note', versionUpload.note.trim());
      formData.append('tag', versionUpload.tag);
      await projectFilesAPI.uploadVersion(selectedFile.id, formData);
      setVersionUpload({ file: null, note: '', tag: selectedFile.tag || 'DRAFT' });
      await refreshProjectData();
      const refreshed = await projectFilesAPI.getFile(selectedFile.id);
      setSelectedFile(refreshed);
      showToast('success', 'Version uploaded', 'The latest revision has been stored.');
    } catch (error) {
      showToast('error', 'Version upload failed', error.response?.data?.error || 'Please try again.');
    }
  };

  const handleRenameFile = async (event) => {
    event.preventDefault();
    if (!selectedFile || !renameValue.trim()) return;
    try {
      await projectFilesAPI.rename(selectedFile.id, renameValue.trim());
      await refreshProjectData();
      const refreshed = await projectFilesAPI.getFile(selectedFile.id);
      setSelectedFile(refreshed);
      showToast('success', 'File renamed', 'Display name updated successfully.');
    } catch (error) {
      showToast('error', 'Rename failed', error.response?.data?.error || 'Please try again.');
    }
  };

  const handleMoveFile = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;
    try {
      await projectFilesAPI.moveFolder(selectedFile.id, moveFolderId || null);
      await refreshProjectData();
      const refreshed = await projectFilesAPI.getFile(selectedFile.id);
      setSelectedFile(refreshed);
      showToast('success', 'File moved', 'Folder changed successfully.');
    } catch (error) {
      showToast('error', 'Move failed', error.response?.data?.error || 'Please try again.');
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    const confirmed = window.confirm(`Delete ${selectedFile.display_name}? It will move to trash.`);
    if (!confirmed) return;
    try {
      await projectFilesAPI.deleteFile(selectedFile.id);
      setSelectedFile(null);
      await refreshProjectData();
      showToast('success', 'File moved to trash', 'You can restore it from the trash panel.');
    } catch (error) {
      showToast('error', 'Delete failed', error.response?.data?.error || 'Please try again.');
    }
  };

  const handleRestore = async (trashEntry) => {
    try {
      await projectFilesAPI.restoreTrash(trashEntry.id);
      await refreshProjectData();
      showToast('success', 'File restored', 'The file has been returned to the library.');
    } catch (error) {
      showToast('error', 'Restore failed', error.response?.data?.error || 'Please try again.');
    }
  };

  return (
    <div className="file-library-page">
      <section className="file-library-hero">
        <div>
          <span className="eyebrow">File Sharing &amp; Version Control</span>
          <h1>Project file library</h1>
          <p>Keep all project documents in one place with folders, version history, trash recovery, and task links.</p>
        </div>
        <div className="file-library-hero-actions">
          <Link to={projectsListPath} className="file-library-secondary-action">
            <i className="fa-solid fa-diagram-project"></i>
            Back to projects
          </Link>
          {currentProject && (
            <Link to={projectDashboardPath} className="file-library-primary-action">
              Open project dashboard
            </Link>
          )}
        </div>
      </section>

      <section className="file-library-toolbar">
        <div className="toolbar-block">
          <label>Project</label>
          <select value={selectedProjectId} onChange={handleProjectChange} disabled={loadingProjects}>
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-block toolbar-wide">
          <label>Search</label>
          <input
            type="search"
            placeholder="Search files, folders, uploads..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="toolbar-block">
          <label>Sort</label>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <button className={`toolbar-toggle ${showTrash ? 'active' : ''}`} onClick={() => setShowTrash((value) => !value)}>
          <i className="fa-solid fa-trash-can"></i>
          {showTrash ? 'Hide trash' : 'Show trash'}
        </button>
      </section>

      <section className="file-library-layout">
        <aside className="file-library-sidebar">
          <div className="panel-card">
            <div className="panel-head">
              <h2>Folders</h2>
              <span>{folders.length}</span>
            </div>
            <button className={`folder-pill ${selectedFolderId === 'all' ? 'active' : ''}`} onClick={() => setSelectedFolderId('all')}>
              All files
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                className={`folder-pill ${String(selectedFolderId) === String(folder.id) ? 'active' : ''}`}
                onClick={() => setSelectedFolderId(String(folder.id))}
              >
                <span>{folder.name}</span>
                <strong>{folder.file_count}</strong>
              </button>
            ))}
          </div>

          <div className="panel-card">
            <div className="panel-head">
              <h2>Create folder</h2>
            </div>
            <form onSubmit={handleCreateFolder} className="stack-form">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                disabled={!selectedProjectId || !canManageFolders}
              />
              <button type="submit" disabled={!selectedProjectId || !newFolderName.trim() || !canManageFolders}>
                Add folder
              </button>
            </form>
          </div>

          <div className="panel-card">
            <div className="panel-head">
              <h2>Trash</h2>
              <span>{trashEntries.length}</span>
            </div>
            <div className="trash-list">
              {trashEntries.length === 0 ? (
                <p className="empty-copy">No files in trash.</p>
              ) : (
                trashEntries.map((entry) => (
                  <div key={entry.id} className="trash-item">
                    <div>
                      <strong>{entry.original_file?.display_name}</strong>
                      <span>{formatDateTime(entry.deletion_timestamp)}</span>
                    </div>
                    <button type="button" onClick={() => handleRestore(entry)}>Restore</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="file-library-main">
          <div className="summary-grid">
            <article className="summary-card">
              <span>Total files</span>
              <strong>{files.length}</strong>
            </article>
            <article className="summary-card">
              <span>Visible files</span>
              <strong>{visibleFiles.length}</strong>
            </article>
            <article className="summary-card">
              <span>Folders</span>
              <strong>{folders.length}</strong>
            </article>
            <article className="summary-card">
              <span>Selected folder</span>
              <strong>{selectedFolder?.name || 'All'}</strong>
            </article>
          </div>

          <section className="panel-card upload-panel">
            <div className="panel-head">
              <h2>Upload a new file</h2>
              <span>{canManageFiles ? 'Allowed' : 'Read only'}</span>
            </div>
            <form onSubmit={handleUploadFile} className="upload-form">
              <div className="upload-grid">
                <label>
                  <span>File</span>
                  <input
                    type="file"
                    onChange={(event) => setUploadState((value) => ({ ...value, file: event.target.files?.[0] || null }))}
                    disabled={!selectedProjectId || !canManageFiles}
                  />
                </label>
                <label>
                  <span>Display name</span>
                  <input
                    type="text"
                    value={uploadState.displayName}
                    onChange={(event) => setUploadState((value) => ({ ...value, displayName: event.target.value }))}
                    placeholder="Optional"
                    disabled={!selectedProjectId || !canManageFiles}
                  />
                </label>
                <label>
                  <span>Folder</span>
                  <select
                    value={uploadState.folderId}
                    onChange={(event) => setUploadState((value) => ({ ...value, folderId: event.target.value }))}
                    disabled={!selectedProjectId || !canManageFiles}
                  >
                    <option value="">General</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Linked task</span>
                  <select
                    value={uploadState.linkedTaskId}
                    onChange={(event) => setUploadState((value) => ({ ...value, linkedTaskId: event.target.value }))}
                    disabled={!selectedProjectId || !canManageFiles}
                  >
                    <option value="">None</option>
                    {taskOptions.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Tag</span>
                  <select
                    value={uploadState.tag}
                    onChange={(event) => setUploadState((value) => ({ ...value, tag: event.target.value }))}
                    disabled={!selectedProjectId || !canManageFiles}
                  >
                    {tagOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="upload-wide">
                  <span>Version note</span>
                  <input
                    type="text"
                    value={uploadState.versionNote}
                    onChange={(event) => setUploadState((value) => ({ ...value, versionNote: event.target.value }))}
                    placeholder="What does this upload change?"
                    disabled={!selectedProjectId || !canManageFiles}
                  />
                </label>
                <label className="upload-wide">
                  <span>Description</span>
                  <textarea
                    value={uploadState.description}
                    onChange={(event) => setUploadState((value) => ({ ...value, description: event.target.value }))}
                    placeholder="Add notes for the team"
                    disabled={!selectedProjectId || !canManageFiles}
                    rows={3}
                  />
                </label>
              </div>
              <button type="submit" className="primary-button" disabled={!selectedProjectId || !canManageFiles || !uploadState.file}>
                Upload file
              </button>
            </form>
          </section>

          <section className="file-grid">
            {loadingProjects || loadingProjectData ? (
              <div className="empty-state panel-card">Loading files...</div>
            ) : visibleFiles.length === 0 ? (
              <div className="empty-state panel-card">
                <i className="fa-regular fa-folder-open"></i>
                <h3>No files found</h3>
                <p>Upload a document or change the current filters.</p>
              </div>
            ) : (
              visibleFiles.map((file) => (
                <button key={file.id} type="button" className={`file-card ${selectedFile?.id === file.id ? 'selected' : ''}`} onClick={() => handleSelectFile(file)}>
                  <div className="file-card-top">
                    <div>
                      <span className="file-tag">{file.tag}</span>
                      <h3>{file.display_name}</h3>
                    </div>
                    <span className={`lock-badge ${file.is_locked ? 'active' : ''}`}>
                      <i className="fa-solid fa-lock"></i>
                      {file.is_locked ? 'Locked' : 'Open'}
                    </span>
                  </div>
                  <p>{file.description || 'No description provided.'}</p>
                  <div className="file-card-meta">
                    <span>{file.folder?.name || 'General'}</span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>v{file.current_version_number}</span>
                  </div>
                </button>
              ))
            )}
          </section>
        </main>

        <aside className="file-library-detail">
          <div className="panel-card detail-card">
            <div className="panel-head">
              <h2>File details</h2>
            </div>
            {!selectedFile ? (
              <p className="empty-copy">Select a file to view versions, activity, and actions.</p>
            ) : (
              <>
                <div className="detail-title">
                  <div>
                    <span className="file-tag">{selectedFile.tag}</span>
                    <h3>{selectedFile.display_name}</h3>
                    <p>{selectedFile.description || 'No description provided.'}</p>
                  </div>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Folder</dt>
                    <dd>{selectedFile.folder?.name || 'General'}</dd>
                  </div>
                  <div>
                    <dt>Uploaded by</dt>
                    <dd>{getUserName(selectedFile.uploaded_by)}</dd>
                  </div>
                  <div>
                    <dt>Current version</dt>
                    <dd>v{selectedFile.current_version_number}</dd>
                  </div>
                  <div>
                    <dt>File size</dt>
                    <dd>{formatFileSize(selectedFile.file_size)}</dd>
                  </div>
                  <div>
                    <dt>Linked task</dt>
                    <dd>{selectedFile.linked_task?.title || 'None'}</dd>
                  </div>
                  <div>
                    <dt>Lock status</dt>
                    <dd>{selectedFile.is_locked ? `Locked by ${selectedFile.version_lock_by?.username || 'another member'}` : 'Available'}</dd>
                  </div>
                </dl>

                <div className="detail-actions">
                  <a href={selectedFile.current_file_url} target="_blank" rel="noreferrer" className="file-library-secondary-action">
                    <i className="fa-solid fa-download"></i>
                    Download
                  </a>
                  <button type="button" onClick={handleLockAndPrepareVersion} disabled={!canManageFiles}>
                    Reserve version upload
                  </button>
                </div>

                <form onSubmit={handleRenameFile} className="stack-form compact">
                  <label>
                    <span>Rename file</span>
                    <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} disabled={!canManageFiles} />
                  </label>
                  <label>
                    <span>Move folder</span>
                    <select value={moveFolderId} onChange={(event) => setMoveFolderId(event.target.value)} disabled={!canManageFiles}>
                      <option value="">General</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="inline-actions">
                    <button type="submit" disabled={!canManageFiles || !renameValue.trim()}>Save name</button>
                    <button type="button" onClick={handleMoveFile} disabled={!canManageFiles}>Move</button>
                  </div>
                </form>

                <form onSubmit={handleUploadVersion} className="stack-form compact version-box">
                  <h4>Upload new version</h4>
                  {selectedFile.is_locked && selectedFile.version_lock_by && (
                    <p className="lock-copy">
                      Locked by {selectedFile.version_lock_by.username} until {formatDateTime(selectedFile.version_lock_expires_at)}
                    </p>
                  )}
                  <label>
                    <span>Version file</span>
                    <input type="file" onChange={(event) => setVersionUpload((value) => ({ ...value, file: event.target.files?.[0] || null }))} disabled={!canManageFiles} />
                  </label>
                  <label>
                    <span>Version note</span>
                    <textarea value={versionUpload.note} onChange={(event) => setVersionUpload((value) => ({ ...value, note: event.target.value }))} rows={3} disabled={!canManageFiles} />
                  </label>
                  <label>
                    <span>Tag</span>
                    <select value={versionUpload.tag} onChange={(event) => setVersionUpload((value) => ({ ...value, tag: event.target.value }))} disabled={!canManageFiles}>
                      {tagOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" disabled={!canManageFiles || !versionUpload.file || !versionUpload.note.trim()}>Upload version</button>
                </form>

                <button type="button" className="danger-button" onClick={handleDeleteFile} disabled={!canManageFiles}>
                  Move to trash
                </button>
              </>
            )}
          </div>

          <div className="panel-card detail-card">
            <div className="panel-head">
              <h2>Versions</h2>
              <span>{versions.length}</span>
            </div>
            <div className="timeline-list">
              {loadingDetails ? (
                <p className="empty-copy">Loading history...</p>
              ) : versions.length === 0 ? (
                <p className="empty-copy">No versions available yet.</p>
              ) : (
                versions.map((version) => (
                  <div key={version.id} className="timeline-item">
                    <div>
                      <strong>v{version.version_number}</strong>
                      <span>{version.version_note || 'No note provided.'}</span>
                    </div>
                    <small>{formatDateTime(version.upload_timestamp)}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel-card detail-card">
            <div className="panel-head">
              <h2>Activity</h2>
              <span>{activityLogs.length}</span>
            </div>
            <div className="timeline-list">
              {activityLogs.length === 0 ? (
                <p className="empty-copy">No activity recorded yet.</p>
              ) : (
                activityLogs.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div>
                      <strong>{item.action_type}</strong>
                      <span>{getUserName(item.actor)}</span>
                    </div>
                    <small>{formatDateTime(item.created_at)}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default ProjectFilesLibrary;
