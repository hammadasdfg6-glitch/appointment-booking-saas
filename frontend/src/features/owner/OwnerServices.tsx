import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Clock, DollarSign, Briefcase, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from '../../hooks/useServices';
import { serviceSchema, ServiceFormData } from '../../lib/zod-schemas';
import { Service } from '../../types/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTableRow } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import { getErrorMessage } from '../../api/client';

export function OwnerServices() {
  const { data: servicesData, isLoading } = useServices(1, 100);
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form for Add/Edit
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      durationMinutes: 30,
      price: 50,
      active: true,
    },
  });

  const services = (servicesData?.services || []).filter((s) => s.active !== false);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    reset({
      name: '',
      description: '',
      durationMinutes: 30,
      price: 50,
      active: true,
    });
    setEditingService(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setValue('name', service.name);
    setValue('description', service.description || '');
    setValue('durationMinutes', service.durationMinutes);
    setValue('price', service.price);
    setValue('active', service.active !== false);
    setIsAddModalOpen(true);
  };

  const onSaveService = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        // Backend quirk: PUT /service/:name requires FULL payload
        await updateServiceMutation.mutateAsync({
          currentName: editingService.name,
          payload: {
            name: data.name,
            description: data.description,
            durationMinutes: Number(data.durationMinutes),
            price: Number(data.price),
            active: data.active,
          },
        });
        toast.success('Service updated successfully!');
      } else {
        await createServiceMutation.mutateAsync({
          name: data.name,
          description: data.description,
          durationMinutes: Number(data.durationMinutes),
          price: Number(data.price),
          active: data.active,
        });
        toast.success('Service created successfully!');
      }
      setIsAddModalOpen(false);
      setEditingService(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingService) return;
    try {
      await deleteServiceMutation.mutateAsync(deletingService.name);
      toast.success('Service deactivated.');
      setDeletingService(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Services & Offerings
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure the services, pricing, and appointment durations available for customer booking.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto shrink-0"
        >
          Add New Service
        </Button>
      </div>

      {/* Search and Filter Bar */}
      {services.length > 0 && (
        <div className="max-w-md">
          <Input
            placeholder="Search services by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      )}

      {/* Services Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-caption font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Service Name</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <>
                  <SkeletonTableRow columns={6} />
                  <SkeletonTableRow columns={6} />
                  <SkeletonTableRow columns={6} />
                </>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Briefcase}
                      title="No services added yet"
                      description="Create your first service offering to start accepting customer appointments."
                      actionLabel="Create Service"
                      onAction={openAddModal}
                    />
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Search}
                      title="No matching services found"
                      description="Try clearing your search query."
                      actionLabel="Clear Search"
                      onAction={() => setSearchTerm('')}
                    />
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr
                    key={service._id || service.name}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {service.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {service.durationMinutes} mins
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="active">Active</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Service"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingService(service)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                          title="Deactivate Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingService(null);
        }}
        title={editingService ? 'Edit Service Offering' : 'Add New Service'}
        description="Enter the service details, pricing, and duration for clients."
      >
        <form onSubmit={handleSubmit(onSaveService)} className="space-y-4 pt-2">
          <Input
            label="Service Name"
            placeholder="e.g. 1-on-1 Consultation"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Description (Optional)"
            placeholder="Brief explanation of what is included in this service"
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min={1}
              max={60}
              helperText="1 to 60 mins (backend maximum)"
              error={errors.durationMinutes?.message}
              {...register('durationMinutes')}
            />

            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              min={0}
              helperText="$0 for free consultations"
              leftAddon={<DollarSign className="w-4 h-4" />}
              error={errors.price?.message}
              {...register('price')}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingService(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              isLoading={createServiceMutation.isPending || updateServiceMutation.isPending}
            >
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Soft Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        title="Deactivate Service"
        description={`Are you sure you want to deactivate "${deletingService?.name}"? It will no longer appear for new bookings.`}
      >
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setDeletingService(null)}
          >
            Keep Active
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            isLoading={deleteServiceMutation.isPending}
            onClick={onConfirmDelete}
          >
            Deactivate Service
          </Button>
        </div>
      </Modal>
    </div>
  );
}
