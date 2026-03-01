import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, User, Trash2 } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getProfile } from '@/storage/repository';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

export default function ProfileSelect() {
  const navigate = useNavigate();
  const { profiles, loadProfiles, createProfile, deleteProfile } = useProfileStore();
  const { setActiveProfile } = useAppStore();
  const { logout } = useAuthStore();

  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  function handleSelectProfile(id: string) {
    setActiveProfile(id);

    try {
      const profile = getProfile(id);
      if (profile.onboarding_complete) {
        navigate('/');
      } else {
        navigate('/onboarding/welcome');
      }
    } catch {
      // Profile data missing, go to onboarding
      navigate('/onboarding/welcome');
    }
  }

  function handleCreateProfile() {
    const trimmed = newProfileName.trim();
    if (!trimmed) return;

    const id = createProfile(trimmed);
    setActiveProfile(id);
    setNewProfileName('');
    setShowNewProfileModal(false);
    navigate('/onboarding/welcome');
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteProfile(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleLogout() {
    await logout();
    navigate('/lock');
  }

  function handleNewProfileKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleCreateProfile();
    }
  }

  const inputClasses =
    'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';

  return (
    <div className="bg-background text-text min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h1 className="text-2xl font-bold">Who's training?</h1>
        <button
          onClick={handleLogout}
          className="cursor-pointer rounded-xl bg-surface p-2.5 text-muted hover:text-text transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Profile Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 content-start">
        {profiles.map((profile) => (
          <Card key={profile.id} className="!mx-0 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2.5">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-text">{profile.name}</p>
                  <p className="text-xs text-muted">
                    Created {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: profile.id, name: profile.name })}
                className="cursor-pointer rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                title="Delete profile"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Button
              title="Select"
              variant="primary"
              size="sm"
              onClick={() => handleSelectProfile(profile.id)}
            />
          </Card>
        ))}

        {/* Add Profile Card */}
        <Card className="!mx-0">
          <button
            onClick={() => setShowNewProfileModal(true)}
            className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full py-4 text-muted hover:text-primary transition-colors"
          >
            <div className="rounded-full border-2 border-dashed border-surface-light p-3">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Add Profile</span>
          </button>
        </Card>
      </div>

      {/* New Profile Modal */}
      <Modal
        open={showNewProfileModal}
        onClose={() => {
          setShowNewProfileModal(false);
          setNewProfileName('');
        }}
        title="New Profile"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Profile name"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyDown={handleNewProfileKeyDown}
            className={inputClasses}
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowNewProfileModal(false);
                setNewProfileName('');
              }}
            />
            <Button
              title="Create"
              variant="primary"
              size="sm"
              onClick={handleCreateProfile}
              disabled={!newProfileName.trim()}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Profile"
      >
        <div className="flex flex-col gap-4">
          <p className="text-muted">
            Are you sure you want to delete <span className="font-semibold text-text">{deleteTarget?.name}</span>?
            All training data for this profile will be permanently removed.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            />
            <Button
              title="Delete"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
