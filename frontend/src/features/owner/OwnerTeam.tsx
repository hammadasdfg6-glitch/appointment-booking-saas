import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, User as UserIcon, Mail, Lock, Shield, Users, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useStaff, useAddStaff, useDeleteStaff } from '../../hooks/useStaff';
import { useAuth } from '../../hooks/useAuth';
import { addStaffSchema, AddStaffFormData } from '../../lib/zod-schemas';
import { User } from '../../types/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTableRow } from '../../components/ui/Skeleton';
import { getErrorMessage } from '../../api/client';

export function OwnerTeam() {
  const { user } = useAuth();
  const orgId = user?.orgId || '';
  const { data: staffList, isLoading } = useStaff();
  const addStaffMutation = useAddStaff(orgId);
  const deleteStaffMutation = useDeleteStaff();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'staff',
    },
  });

  const onAddStaff = async (data: AddStaffFormData) => {
    try {
      // Backend quirk: endpoint POST /auth/orgs/:orgId/staff expects field 'passwordHash'
      await addStaffMutation.mutateAsync({
        name: data.name,
        email: data.email,
        passwordHash: data.password,
        role: data.role,
      });
      toast.success('Team member added successfully!');
      reset();
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingStaff?._id) return;
    if (deletingStaff.role === 'owner') {
      toast.error('The organization owner account cannot be removed.');
      setDeletingStaff(null);
      return;
    }

    try {
      await deleteStaffMutation.mutateAsync(deletingStaff._id);
      toast.success('Team member removed.');
      setDeletingStaff(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const team = staffList || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Team & Staff
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your service providers, staff accounts, and role permissions.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto shrink-0"
        >
          Add Team Member
        </Button>
      </div>

      {/* Staff Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-caption font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <>
                  <SkeletonTableRow columns={4} />
                  <SkeletonTableRow columns={4} />
                  <SkeletonTableRow columns={4} />
                </>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8">
                    <EmptyState
                      icon={Users}
                      title="No team members found"
                      description="Add your first staff member to start assigning appointments."
                      actionLabel="Add Staff"
                      onAction={() => setIsAddModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                team.map((member) => {
                  const isOwner = member.role === 'owner';
                  return (
                    <tr
                      key={member._id || member.email}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-caption">
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {member.email}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={member.role} className="capitalize">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isOwner ? (
                          <button
                            onClick={() => setDeletingStaff(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                            title="Remove staff member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-caption text-slate-400 italic">Owner</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Team Member"
        description="Create login credentials for a new staff member in your organization."
      >
        <form onSubmit={handleSubmit(onAddStaff)} className="space-y-4 pt-2">
          <Input
            label="Full Name"
            placeholder="John Doe"
            leftAddon={<UserIcon className="w-4 h-4" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            leftAddon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Temporary Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 4 characters"
            leftAddon={<Lock className="w-4 h-4" />}
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          <Select
            label="Role Assignment"
            error={errors.role?.message}
            {...register('role')}
          >
            <option value="staff">Staff (Service Provider)</option>
            <option value="owner">Owner (Administrator)</option>
          </Select>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              isLoading={addStaffMutation.isPending}
            >
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Staff Confirmation */}
      <Modal
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        title="Remove Team Member"
        description={`Are you sure you want to remove "${deletingStaff?.name}" from your organization?`}
      >
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setDeletingStaff(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            isLoading={deleteStaffMutation.isPending}
            onClick={onConfirmDelete}
          >
            Remove Member
          </Button>
        </div>
      </Modal>
    </div>
  );
}
