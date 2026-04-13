import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import { projectsAPI, projectFilesAPI, taskAPI } from '../../services/api';
import Modal from '../../components/Modal';
import './ProjectFilesLibrary.css';

const tagOptions = ['DRAFT', 'FINAL', 'REFERENCE', 'ARCHIVE'];

const sortOptions = [
  { value: 'latest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'size', label: 'Largest' },
];

const formatFileSize = (size = 0) => {
  if (!size) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let current = size;
  let idx = 0;
  while (current >= 1024 && idx < units.length - 1) {
    current /= 1024;
    idx += 1;
  }
  return `${current.toFixed(current >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const getUserLabel = (user) => {
  if (!user) return 'Unknown';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || 'Unknown';
};

const buildTaskOptions = (tasks) => tasks.map((task) => ({ value: String(task.id), label: task.title }));

export const ProjectFilesLibrary = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') || '');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [trashEntries, setTrashEntries] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState('versions');

  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [tagFilter, setTagFilter] = useState('all');
  const [uploaderFilter, setUploaderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    display_name: '',
    folder_id: '',
    tag: 'DRAFT',
    linked_task_id: '',
    version_note: '',
    description: '',
  });
  const [versionForm, setVersionForm] = useState({
    file: null,
    version_note: '',
    tag: 'DRAFT',
  });

  const isLecturerRoute = location.pathname.startsWith('/lecturer/');
  const projectsPath = isLecturerRoute ? '/lecturer/projects' : '/student/projects';

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsAPI.list();
        const list = Array.isArray(data) ? data : data?.results || [];
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          const firstProjectId = String(list[0].id);
          setSelectedProjectId(firstProjectId);
          const next = new URLSearchParams(searchParams);
          next.set('project', firstProjectId);
          setSearchParams(next, { replace: true });
        }
      } catch (error) {
        showToast('error', 'Projects unavailable', 'Could not load projects.');
      }
    };

    loadProjects();
  }, [selectedProjectId, searchParams, setSearchParams, showToast]);

  useEffect(() => {
    const syncFromQuery = searchParams.get('project') || '';
    if (syncFromQuery !== selectedProjectId) {
      setSelectedProjectId(syncFromQuery);
    }
  }, [searchParams, selectedProjectId]);

  useEffect(() => {
    const loadProjectContext = async () => {
      if (!selectedProjectId) {
        setFolders([]);
        setFiles([]);
        setTrashEntries([]);
        setTaskOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const [foldersData, filesData, trashData, tasksData] = await Promise.all([
          projectFilesAPI.listFolders({ project: selectedProjectId }),
          projectFilesAPI.listFiles({ project: selectedProjectId, include_deleted: '0' }),
          projectFilesAPI.listTrash({ project: selectedProjectId }),
          taskAPI.listTasks({ project: selectedProjectId }),
        ]);

        const resolvedFolders = Array.isArray(foldersData) ? foldersData : foldersData?.results || [];
        const resolvedFiles = Array.isArray(filesData) ? filesData : filesData?.results || [];
        const resolvedTrash = Array.isArray(trashData) ? trashData : trashData?.results || [];
        const resolvedTasks = Array.isArray(tasksData) ? tasksData : tasksData?.results || [];

        setFolders(resolvedFolders);
        setFiles(resolvedFiles);
        setTrashEntries(resolvedTrash);
        setTaskOptions(buildTaskOptions(resolvedTasks));
        setSelectedFile(null);
      } catch (error) {
        showToast('error', 'File library unavailable', error.response?.data?.error || 'Could not load project files.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectContext();
  }, [selectedProjectId, showToast]);

  useEffect(() => {
    const loadFileDetails = async () => {
      if (!selectedFile?.id) {
        setVersions([]);
        setActivity([]);
        return;
      }

      setIsDetailLoading(true);
      try {
        const [versionsData, activityData] = await Promise.all([
          projectFilesAPI.listVersions({ file: selectedFile.id }),
          projectFilesAPI.listActivity({ file: selectedFile.id }),
        ]);
        setVersions(Array.isArray(versionsData) ? versionsData : versionsData?.results || []);
        setActivity(Array.isArray(activityData) ? activityData : activityData?.results || []);
      } catch (error) {
        setVersions([]);
        setActivity([]);
      } finally {
        setIsDetailLoading(false);
      }
    };

    loadFileDetails();
  }, [selectedFile]);

  const currentProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const dashboardPath = currentProject
    ? `${projectsPath}/${currentProject.id}`
    : projectsPath;

  const uploaderOptions = useMemo(() => {
    const map = new Map();
    files.forEach((file) => {
      if (file.uploaded_by?.id) {
        map.set(String(file.uploaded_by.id), getUserLabel(file.uploaded_by));
      }
    });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [files]);

  const fileTypeOptions = useMemo(() => {
    const set = new Set(files.map((file) => (file.file_extension || '').toLowerCase()).filter(Boolean));
    return [...set].map((ext) => ({ value: ext, label: ext.replace('.', '').toUpperCase() }));
  }, [files]);

  const filteredFiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const result = files
      .filter((file) => (selectedFolderId === 'all' ? true : String(file.folder?.id || '') === String(selectedFolderId)))
      .filter((file) => (tagFilter === 'all' ? true : file.tag === tagFilter))
      .filter((file) => (uploaderFilter === 'all' ? true : String(file.uploaded_by?.id || '') === uploaderFilter))
      .filter((file) => (typeFilter === 'all' ? true : (file.file_extension || '').toLowerCase() === typeFilter))
      .filter((file) => {
        if (!query) return true;
        return [file.display_name, file.description, file.stored_file_name, file.folder?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });

    return result.sort((a, b) => {
      if (sortBy === 'name') return (a.display_name || '').localeCompare(b.display_name || '');
      if (sortBy === 'size') return (b.file_size || 0) - (a.file_size || 0);
      const leftTime = new Date(a.current_version_file?.upload_timestamp || a.upload_timestamp || 0).getTime();
      const rightTime = new Date(b.current_version_file?.upload_timestamp || b.upload_timestamp || 0).getTime();
      return sortBy === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [files, searchTerm, selectedFolderId, sortBy, tagFilter, uploaderFilter, typeFilter]);

  const filteredTrash = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return trashEntries.filter((entry) => {
      if (!query) return true;
      return String(entry.original_file?.display_name || '').toLowerCase().includes(query);
    });
  }, [trashEntries, searchTerm]);

  const storageUsedBytes = useMemo(
    () => files.reduce((sum, file) => sum + (file.file_size || 0), 0),
    [files]
  );

  const closePanels = () => {
    setSelectedFile(null);
    setIsVersionModalOpen(false);
    setActiveDetailTab('versions');
  };

  const reloadProjectFiles = async () => {
    if (!selectedProjectId) return;
    const [filesData, trashData] = await Promise.all([
      projectFilesAPI.listFiles({ project: selectedProjectId, include_deleted: '0' }),
      projectFilesAPI.listTrash({ project: selectedProjectId }),
    ]);
    const resolvedFiles = Array.isArray(filesData) ? filesData : filesData?.results || [];
    const resolvedTrash = Array.isArray(trashData) ? trashData : trashData?.results || [];
    setFiles(resolvedFiles);
    setTrashEntries(resolvedTrash);
    if (selectedFile) {
      const refreshed = resolvedFiles.find((file) => file.id === selectedFile.id);
      setSelectedFile(refreshed || null);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId);
    const next = new URLSearchParams(searchParams);
    if (projectId) {
      next.set('project', projectId);
    } else {
      next.delete('project');
    }
    setSearchParams(next);
    closePanels();
  };

  const handleCreateFolder = async () => {
    if (!selectedProjectId || !newFolderName.trim()) return;
    try {
      await projectFilesAPI.createFolder({ project: selectedProjectId, name: newFolderName.trim() });
      const foldersData = await projectFilesAPI.listFolders({ project: selectedProjectId });
      const resolvedFolders = Array.isArray(foldersData) ? foldersData : foldersData?.results || [];
      setFolders(resolvedFolders);
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      showToast('success', 'Folder Created', 'New folder has been added.');
    } catch (error) {
      showToast('error', 'Folder Error', error.response?.data?.error || 'Could not create folder.');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedProjectId || !uploadForm.file) {
      showToast('error', 'Missing File', 'Please choose a file to upload.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('project', selectedProjectId);
      formData.append('file', uploadForm.file);
      if (uploadForm.display_name.trim()) formData.append('display_name', uploadForm.display_name.trim());
      if (uploadForm.folder_id) formData.append('folder_id', uploadForm.folder_id);
      if (uploadForm.tag) formData.append('tag', uploadForm.tag);
      if (uploadForm.linked_task_id) formData.append('linked_task_id', uploadForm.linked_task_id);
      if (uploadForm.version_note.trim()) formData.append('version_note', uploadForm.version_note.trim());
      if (uploadForm.description.trim()) formData.append('description', uploadForm.description.trim());

      await projectFilesAPI.createFile(formData);
      await reloadProjectFiles();
      setIsUploadModalOpen(false);
      setUploadForm({
        file: null,
        display_name: '',
        folder_id: '',
        tag: 'DRAFT',
        linked_task_id: '',
        version_note: '',
        description: '',
      });
      showToast('success', 'Upload Complete', 'File uploaded to project library.');
    } catch (error) {
      showToast('error', 'Upload Failed', error.response?.data?.error || 'Could not upload file.');
    }
  };

  const handleUploadVersion = async () => {
    if (!selectedFile || !versionForm.file || !versionForm.version_note.trim()) {
      showToast('error', 'Missing Fields', 'Version file and note are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', versionForm.file);
      formData.append('version_note', versionForm.version_note.trim());
      formData.append('tag', versionForm.tag);
      await projectFilesAPI.uploadVersion(selectedFile.id, formData);
      await reloadProjectFiles();
      const refreshed = await projectFilesAPI.getFile(selectedFile.id);
      setSelectedFile(refreshed);
      setIsVersionModalOpen(false);
      setVersionForm({ file: null, version_note: '', tag: selectedFile.tag || 'DRAFT' });
      showToast('success', 'Version Added', 'New version uploaded successfully.');
    } catch (error) {
      showToast('error', 'Version Upload Failed', error.response?.data?.error || 'Could not upload new version.');
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    try {
      await projectFilesAPI.deleteFile(selectedFile.id);
      await reloadProjectFiles();
      setSelectedFile(null);
      showToast('success', 'Moved to Trash', 'File has been moved to trash.');
    } catch (error) {
      showToast('error', 'Delete Failed', error.response?.data?.error || 'Could not delete file.');
    }
  };

  const handleRestoreFile = async (trashId) => {
    try {
      await projectFilesAPI.restoreTrash(trashId);
      await reloadProjectFiles();
      showToast('success', 'Restored', 'File has been restored from trash.');
    } catch (error) {
      showToast('error', 'Restore Failed', error.response?.data?.error || 'Could not restore file.');
    }
  };

  const fileRows = isTrashView ? filteredTrash : filteredFiles;

  return (
    <div className="file-library-shell">
      <aside className="library-sidebar">
        <div className="sidebar-top">
          <h2>{currentProject?.title || 'Project File Library'}</h2>
          <select value={selectedProjectId} onChange={(event) => handleProjectChange(event.target.value)}>
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </div>

        <div className="folders-panel">
          <div className="folders-header">
            <h3>Folders</h3>
            <button type="button" className="link-button" onClick={() => setIsCreateFolderOpen((value) => !value)}>+ New Folder</button>
          </div>
          {isCreateFolderOpen && (
            <div className="inline-folder-create">
              <input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Folder name"
              />
              <button type="button" onClick={handleCreateFolder}>Create</button>
            </div>
          )}

          <button
            type="button"
            className={`folder-item ${selectedFolderId === 'all' && !isTrashView ? 'active' : ''}`}
            onClick={() => {
              setIsTrashView(false);
              setSelectedFolderId('all');
            }}
          >
            <span>All Files</span>
            <small>{files.length}</small>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={`folder-item ${String(selectedFolderId) === String(folder.id) && !isTrashView ? 'active' : ''}`}
              onClick={() => {
                setIsTrashView(false);
                setSelectedFolderId(String(folder.id));
              }}
            >
              <span>{folder.name}</span>
              <small>{folder.file_count}</small>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className={`folder-item trash-link ${isTrashView ? 'active' : ''}`}
            onClick={() => {
              setIsTrashView(true);
              setSelectedFile(null);
            }}
          >
            <span>Trash</span>
            <small>{trashEntries.length}</small>
          </button>
          <Link to={dashboardPath} className="sidebar-nav-link">Project Dashboard</Link>
          <Link to={projectsPath} className="sidebar-nav-link">Back to Projects</Link>
        </div>
      </aside>

      <main className="library-main">
        <header className="library-toolbar">
          <div className="toolbar-left">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={isTrashView ? 'Search trash...' : 'Search files...'}
            />
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} disabled={isTrashView}>
              <option value="all">All Tags</option>
              {tagOptions.map((tag) => (<option key={tag} value={tag}>{tag}</option>))}
            </select>
            <select value={uploaderFilter} onChange={(event) => setUploaderFilter(event.target.value)} disabled={isTrashView}>
              <option value="all">All Members</option>
              {uploaderOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} disabled={isTrashView}>
              <option value="all">All Types</option>
              {fileTypeOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>

          <div className="toolbar-right">
            <div className="view-toggle" role="group" aria-label="View mode">
              <button type="button" className={!isGridView ? '' : 'active'} onClick={() => setIsGridView(true)}>Grid</button>
              <button type="button" className={isGridView ? '' : 'active'} onClick={() => setIsGridView(false)}>List</button>
            </div>
            {!isTrashView && (
              <button type="button" className="upload-button" onClick={() => setIsUploadModalOpen(true)}>+ Upload File</button>
            )}
          </div>
        </header>

        <section className="stats-strip">
          <span>Total Files: <strong>{files.length}</strong></span>
          <span>Folders: <strong>{folders.length}</strong></span>
          <span>Storage Used: <strong>{formatFileSize(storageUsedBytes)}</strong></span>
          {searchTerm.trim() && <span>Showing <strong>{fileRows.length}</strong> results for "{searchTerm.trim()}"</span>}
        </section>

        {isLoading ? (
          <div className="library-empty">Loading files...</div>
        ) : fileRows.length === 0 ? (
          <div className="library-empty">
            {isTrashView ? (
              <>
                <h3>Trash is empty</h3>
                <p>Deleted files will appear here for restoration before purge.</p>
              </>
            ) : (
              <>
                <h3>No files yet</h3>
                <p>Upload your first document to start the project library.</p>
                <button type="button" className="upload-button" onClick={() => setIsUploadModalOpen(true)}>Upload First File</button>
              </>
            )}
          </div>
        ) : (
          <section className={`file-results ${isGridView ? 'grid' : 'list'}`}>
            {isTrashView
              ? filteredTrash.map((entry) => (
                <article key={entry.id} className="file-card muted">
                  <div>
                    <h4>{entry.original_file?.display_name}</h4>
                    <p>Deleted: {formatDate(entry.deletion_timestamp)}</p>
                    <p>Deletes on: {formatDate(entry.scheduled_purge_date)}</p>
                  </div>
                  <button type="button" onClick={() => handleRestoreFile(entry.id)}>Restore</button>
                </article>
              ))
              : filteredFiles.map((file) => (
                <article
                  key={file.id}
                  className={`file-card ${selectedFile?.id === file.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div>
                    <h4>{file.display_name}</h4>
                    <p>{file.folder?.name || 'General'} · {file.file_extension || 'file'}</p>
                    <p>{getUserLabel(file.uploaded_by)} · {formatDate(file.current_version_file?.upload_timestamp || file.upload_timestamp)}</p>
                  </div>
                  <div className="file-card-right">
                    <span className={`tag-badge ${String(file.tag || '').toLowerCase()}`}>{file.tag}</span>
                    <small>v{file.current_version_number}</small>
                  </div>
                </article>
              ))}
          </section>
        )}
      </main>

      {selectedFile && !isTrashView && (
        <aside className="file-detail-panel">
          <header>
            <div>
              <h3>{selectedFile.display_name}</h3>
              <p>{selectedFile.tag} · v{selectedFile.current_version_number}</p>
            </div>
            <button type="button" onClick={() => setSelectedFile(null)} aria-label="Close details">X</button>
          </header>

          <section className="meta-grid">
            <div><span>Uploaded by</span><strong>{getUserLabel(selectedFile.uploaded_by)}</strong></div>
            <div><span>Date</span><strong>{formatDate(selectedFile.upload_timestamp)}</strong></div>
            <div><span>Size</span><strong>{formatFileSize(selectedFile.file_size)}</strong></div>
            <div><span>Folder</span><strong>{selectedFile.folder?.name || 'General'}</strong></div>
            <div><span>Linked Task</span><strong>{selectedFile.linked_task?.title || 'None'}</strong></div>
            <div><span>Description</span><strong>{selectedFile.description || 'No description'}</strong></div>
          </section>

          <div className="detail-actions">
            {selectedFile.current_file_url && (
              <a href={selectedFile.current_file_url} target="_blank" rel="noreferrer" className="button-link">Download</a>
            )}
            <button type="button" onClick={() => {
              setVersionForm((prev) => ({ ...prev, tag: selectedFile.tag || 'DRAFT' }));
              setIsVersionModalOpen(true);
            }}>Upload New Version</button>
            <button type="button" className="danger" onClick={handleDeleteFile}>Delete</button>
          </div>

          <div className="detail-tabs">
            <button type="button" className={activeDetailTab === 'versions' ? 'active' : ''} onClick={() => setActiveDetailTab('versions')}>Versions</button>
            <button type="button" className={activeDetailTab === 'activity' ? 'active' : ''} onClick={() => setActiveDetailTab('activity')}>Activity</button>
          </div>

          <div className="detail-feed">
            {isDetailLoading ? (
              <p>Loading...</p>
            ) : activeDetailTab === 'versions' ? (
              versions.map((version) => (
                <article key={version.id}>
                  <strong>v{version.version_number}</strong>
                  <p>{version.version_note || 'No note'}</p>
                  <small>{getUserLabel(version.uploader)} · {formatDate(version.upload_timestamp)}</small>
                </article>
              ))
            ) : (
              activity.map((item) => (
                <article key={item.id}>
                  <strong>{item.action_type}</strong>
                  <p>{getUserLabel(item.actor)}</p>
                  <small>{formatDate(item.created_at)}</small>
                </article>
              ))
            )}
          </div>
        </aside>
      )}

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload File"
        subtitle="Add a document to the project file library"
        onConfirm={handleUploadFile}
        confirmText="Upload"
      >
        <form className="library-modal-form" onSubmit={(event) => {
          event.preventDefault();
          handleUploadFile();
        }}>
          <label>
            File
            <input type="file" onChange={(event) => setUploadForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))} required />
          </label>
          {uploadForm.file && (
            <p className="selected-file-preview">Selected: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})</p>
          )}
          <label>
            Display Name
            <input value={uploadForm.display_name} onChange={(event) => setUploadForm((prev) => ({ ...prev, display_name: event.target.value }))} />
          </label>
          <label>
            Folder
            <select value={uploadForm.folder_id} onChange={(event) => setUploadForm((prev) => ({ ...prev, folder_id: event.target.value }))}>
              <option value="">General</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </label>
          <label>
            Tag
            <select value={uploadForm.tag} onChange={(event) => setUploadForm((prev) => ({ ...prev, tag: event.target.value }))}>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
          <label>
            Link to Task (optional)
            <select value={uploadForm.linked_task_id} onChange={(event) => setUploadForm((prev) => ({ ...prev, linked_task_id: event.target.value }))}>
              <option value="">No linked task</option>
              {taskOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Version Note
            <input value={uploadForm.version_note} onChange={(event) => setUploadForm((prev) => ({ ...prev, version_note: event.target.value }))} />
          </label>
          <label>
            Description
            <textarea rows={3} value={uploadForm.description} onChange={(event) => setUploadForm((prev) => ({ ...prev, description: event.target.value }))} />
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Upload New Version"
        subtitle={selectedFile ? `You are uploading version ${selectedFile.current_version_number + 1} of ${selectedFile.display_name}` : ''}
        onConfirm={handleUploadVersion}
        confirmText="Upload Version"
      >
        <form className="library-modal-form" onSubmit={(event) => {
          event.preventDefault();
          handleUploadVersion();
        }}>
          <label>
            File (required)
            <input type="file" onChange={(event) => setVersionForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))} required />
          </label>
          <label>
            Tag
            <select value={versionForm.tag} onChange={(event) => setVersionForm((prev) => ({ ...prev, tag: event.target.value }))}>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
          <label>
            Version Note (required)
            <textarea
              rows={3}
              value={versionForm.version_note}
              onChange={(event) => setVersionForm((prev) => ({ ...prev, version_note: event.target.value }))}
              required
            />
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectFilesLibrary;
