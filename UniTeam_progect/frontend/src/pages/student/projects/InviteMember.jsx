import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { invitationsAPI, projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import './ProjectForms.css';

export const InviteMember = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [invitationFilter, setInvitationFilter] = useState('ALL');
  const [students, setStudents] = useState([]);
  const [projectInvitations, setProjectInvitations] = useState([]);

  const loadCandidates = async (search = '') => {
    setLoading(true);
    try {
      const data = await projectsAPI.getCandidateStudents(id, search);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Error', 'Could not load student candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates('');
    loadProjectInvitations('ALL');
  }, [id]);

  const loadProjectInvitations = async (status = 'ALL') => {
    try {
      const apiStatus = status === 'ALL' ? '' : status;
      const data = await projectsAPI.getInvitationsOverview(id, apiStatus);
      setProjectInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Error', 'Could not load project invitations');
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter((s) => {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      return (
        s.username?.toLowerCase().includes(q)
        || fullName.includes(q)
        || s.email?.toLowerCase().includes(q)
      );
    });
  }, [students, query]);

  const handleInvite = async (studentId) => {
    setInvitingId(studentId);
    try {
      await projectsAPI.inviteMember(id, studentId);
      showToast('success', 'Invitation Sent', 'Student has been invited successfully');
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      loadProjectInvitations(invitationFilter);
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to send invitation';
      showToast('error', 'Invite Failed', msg);
    } finally {
      setInvitingId(null);
    }
  };

  const handleResend = async (invitationId) => {
    setResendingId(invitationId);
    try {
      await invitationsAPI.resend(invitationId);
      showToast('success', 'Invitation Resent', 'Invitation has been resent and expiry was extended');
      await loadProjectInvitations(invitationFilter);
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to resend invitation';
      showToast('error', 'Resend Failed', msg);
    } finally {
      setResendingId(null);
    }
  };

  const applyInvitationFilter = async (status) => {
    setInvitationFilter(status);
    await loadProjectInvitations(status);
  };

  return (
    <div className="project-form-page">
      <div className="form-header">
        <div>
          <h1>Invite Teammates</h1>
          <p className="form-description">Search students and invite them to this project.</p>
        </div>
        <Link to={`/student/projects/${id}`} className="btn-secondary">
          <i className="fa-solid fa-arrow-left"></i>
          Back to Project
        </Link>
      </div>

      <div className="project-form">
        <div className="form-card">
          <h3>Search Students</h3>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Search by username, name, or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="form-card">
          <h3>Candidate Students</h3>

          {loading && <p>Loading students...</p>}

          {!loading && filtered.length === 0 && (
            <p>No available students found for invitation.</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((student) => (
                <div key={student.id} className="form-row" style={{ alignItems: 'center' }}>
                  <div>
                    <strong>{student.first_name} {student.last_name}</strong>
                    <div style={{ opacity: 0.75 }}>@{student.username} · {student.email}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleInvite(student.id)}
                    disabled={invitingId === student.id}
                  >
                    {invitingId === student.id ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-card">
          <h3>Invitation Lifecycle</h3>
          <div className="form-row" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
            {['ALL', 'PENDING', 'EXPIRED', 'DECLINED', 'ACCEPTED'].map((status) => (
              <button
                key={status}
                type="button"
                className={invitationFilter === status ? 'btn-primary' : 'btn-secondary'}
                onClick={() => applyInvitationFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {projectInvitations.length === 0 ? (
            <p>No invitations found for this filter.</p>
          ) : (
            <div className="space-y-3">
              {projectInvitations.map((inv) => {
                const canResend = inv.status !== 'ACCEPTED';
                return (
                  <div key={inv.id} className="form-row" style={{ alignItems: 'center' }}>
                    <div>
                      <strong>{inv.receiver?.first_name} {inv.receiver?.last_name}</strong>
                      <div style={{ opacity: 0.75 }}>
                        @{inv.receiver?.username} · {inv.receiver?.email}
                      </div>
                      <div style={{ opacity: 0.75 }}>
                        Status: {inv.status} · Expires: {inv.expires_at ? new Date(inv.expires_at).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleResend(inv.id)}
                      disabled={!canResend || resendingId === inv.id}
                    >
                      {resendingId === inv.id ? 'Resending...' : 'Resend'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteMember;
